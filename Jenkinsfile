pipeline {
  agent any

  environment {
    DOCKERHUB_USER   = "aakash985"
    CUSTOMER_IMAGE   = "${DOCKERHUB_USER}/bitrush-customer"
    RESTAURANT_IMAGE = "${DOCKERHUB_USER}/smartqueue-restaurant"
    IMAGE_TAG        = "${BUILD_NUMBER}"
    K8S_NAMESPACE    = "smartqueue"
  }

  stages {

    // ── 1. Checkout ──────────────────────────────────────────────────────────
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git log --oneline -1'
      }
    }

    // ── 2. Install Lambda dependencies ────────────────────────────────────────
    stage('Install Lambda Deps') {
      steps {
        sh """
          for dir in infra/lambda/*/; do
            if [ -f "\${dir}package.json" ]; then
              echo "Installing deps in \${dir}..."
              npm install --omit=dev --prefix "\${dir}" --silent
            fi
          done
        """
      }
    }

    // ── 3. Provision RDS + Lambdas via Terraform ──────────────────────────────
    stage('Terraform: Provision RDS & Infra') {
      steps {
        withCredentials([
          string(credentialsId: 'DB_PASSWORD', variable: 'DB_PASS')
        ]) {
          sh """
            cd infra
            terraform init -input=false
            terraform apply -auto-approve -input=false \
              -var="db_password=\${DB_PASS}"
          """
          // Capture the new API Gateway URL output and store for next stages
          script {
            env.API_GATEWAY_URL = sh(
              script: "cd infra && terraform output -raw api_gateway_url",
              returnStdout: true
            ).trim()
            echo "API Gateway URL: ${env.API_GATEWAY_URL}"
          }
        }
      }
    }

    // ── 4. Build Docker images (API URL injected from Terraform output) ────────
    stage('Build Images') {
      parallel {

        stage('customer-app') {
          steps {
            withCredentials([
              string(credentialsId: 'MASTER_KEY', variable: 'MKEY')
            ]) {
              sh """
                docker build \
                  --build-arg VITE_API_URL=${env.API_GATEWAY_URL} \
                  --build-arg VITE_MASTER_KEY=\${MKEY} \
                  -t ${CUSTOMER_IMAGE}:${IMAGE_TAG} \
                  -t ${CUSTOMER_IMAGE}:latest \
                  ./customers-app
              """
            }
          }
        }

        stage('restaurant-app') {
          steps {
            withCredentials([
              string(credentialsId: 'MASTER_KEY', variable: 'MKEY')
            ]) {
              sh """
                docker build \
                  --build-arg VITE_API_URL=${env.API_GATEWAY_URL} \
                  --build-arg VITE_MASTER_KEY=\${MKEY} \
                  -t ${RESTAURANT_IMAGE}:${IMAGE_TAG} \
                  -t ${RESTAURANT_IMAGE}:latest \
                  ./restaurant-app
              """
            }
          }
        }

      }
    }

    // ── 5. Push to DockerHub ──────────────────────────────────────────────────
    stage('Push to DockerHub') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-credentials',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh """
            echo "\${DOCKER_PASS}" | docker login -u "\${DOCKER_USER}" --password-stdin
            docker push ${CUSTOMER_IMAGE}:${IMAGE_TAG}
            docker push ${CUSTOMER_IMAGE}:latest
            docker push ${RESTAURANT_IMAGE}:${IMAGE_TAG}
            docker push ${RESTAURANT_IMAGE}:latest
            docker logout
          """
        }
      }
    }

    // ── 6. Deploy to Kubernetes ───────────────────────────────────────────────
    stage('Deploy to Kubernetes') {
      steps {
        sh """
          kubectl apply -f k8s/namespace.yaml

          sed 's|DOCKERHUB_USER|${DOCKERHUB_USER}|g; s|IMAGE_TAG|${IMAGE_TAG}|g' \
            k8s/customer-app.yaml | kubectl apply -f -

          sed 's|DOCKERHUB_USER|${DOCKERHUB_USER}|g; s|IMAGE_TAG|${IMAGE_TAG}|g' \
            k8s/restaurant-app.yaml | kubectl apply -f -
        """
      }
    }

    // ── 7. Verify rollout ─────────────────────────────────────────────────────
    stage('Verify Rollout') {
      steps {
        sh """
          kubectl rollout status deployment/customer-app   -n ${K8S_NAMESPACE} --timeout=120s
          kubectl rollout status deployment/restaurant-app -n ${K8S_NAMESPACE} --timeout=120s
          kubectl get pods -n ${K8S_NAMESPACE}
          kubectl get svc  -n ${K8S_NAMESPACE}
        """
      }
    }

    // ── 8. Cleanup ────────────────────────────────────────────────────────────
    stage('Cleanup') {
      steps {
        sh "docker image prune -f || true"
      }
    }

  }

  post {
    success {
      sh """
        EC2_IP=\$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP')
        echo "============================================"
        echo "✅  BUILD #${BUILD_NUMBER} DEPLOYED"
        echo "--------------------------------------------"
        echo "customer-app   → http://\${EC2_IP}:30174"
        echo "restaurant-app → http://\${EC2_IP}:30175"
        echo "API Gateway    → ${env.API_GATEWAY_URL}"
        echo "============================================"
      """
    }
    failure {
      sh """
        echo "❌ Build failed — rolling back"
        kubectl rollout undo deployment/customer-app   -n ${K8S_NAMESPACE} || true
        kubectl rollout undo deployment/restaurant-app -n ${K8S_NAMESPACE} || true
      """
    }
  }
}
