pipeline {
  agent any

  environment {
    DOCKERHUB_USER = "aakash985"
    APP_IMAGE      = "${DOCKERHUB_USER}/bitrush-app"
    IMAGE_TAG      = "${BUILD_NUMBER}"
    K8S_NAMESPACE  = "bitrush"
  }

  stages {

    // ── 1. Checkout ──────────────────────────────────────────────────────────
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git log --oneline -1'
      }
    }

    // ── 2. Deploy Lambda Functions ────────────────────────────────────────────
    stage('Deploy Lambda') {
      steps {
        withCredentials([
          string(credentialsId: 'AWS_ACCESS_KEY_ID',     variable: 'AWS_ACCESS_KEY_ID'),
          string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY'),
          string(credentialsId: 'AWS_REGION',            variable: 'AWS_DEFAULT_REGION'),
          string(credentialsId: 'DB_PASSWORD',           variable: 'DB_PASSWORD'),
          string(credentialsId: 'MASTER_KEY',            variable: 'MASTER_KEY')
        ]) {
          sh """
            # Absolute path anchored to Jenkins workspace — never breaks across iterations
            WORKSPACE_ROOT=\$(pwd)
            LAMBDA_DIR=\${WORKSPACE_ROOT}/deliver_management_system/infra/lambda
            DB_HOST=smartqueue-mysql.cliwcewwcbhv.ap-southeast-1.rds.amazonaws.com

            echo "=== Workspace: \${WORKSPACE_ROOT} ==="
            echo "=== Lambda dir: \${LAMBDA_DIR} ==="

            for fn in getRestaurants getRestaurantById login register placeOrder getOrders updateOrder deleteRestaurant updateRestaurant customerRegister customerLogin getUploadUrl; do
              echo "--- Deploying \$fn ---"
              FN_DIR=\${LAMBDA_DIR}/\$fn

              if [ ! -d "\${FN_DIR}" ]; then
                echo "ERROR: Directory \${FN_DIR} not found — skipping"
                continue
              fi

              # Run everything in a subshell so the working dir never drifts
              (
                cd "\${FN_DIR}"
                npm install --omit=dev
                zip -r \${fn}.zip . -x "*.log" "package-lock.json"
                aws lambda update-function-code \\
                  --function-name smartqueue-\$fn \\
                  --zip-file fileb://\${fn}.zip \\
                  --region \${AWS_DEFAULT_REGION} > /dev/null
                aws lambda wait function-updated \\
                  --function-name smartqueue-\$fn \\
                  --region \${AWS_DEFAULT_REGION}
                aws lambda update-function-configuration \\
                  --function-name smartqueue-\$fn \\
                  --environment "Variables={DB_HOST=\$DB_HOST,DB_PORT=3306,DB_NAME=smartqueue,DB_USER=admin,DB_PASSWORD=\${DB_PASSWORD},JWT_SECRET=smartqueue-secret,MASTER_KEY=\${MASTER_KEY},S3_BUCKET=smartqueue-images-948976368048}" \\
                  --region \${AWS_DEFAULT_REGION} > /dev/null
                aws lambda wait function-updated \\
                  --function-name smartqueue-\$fn \\
                  --region \${AWS_DEFAULT_REGION}
                rm \${fn}.zip
              )
            done
          """
        }
      }
    }

    // ── 3. Build Docker Image ─────────────────────────────────────────────────
    stage('Build Image') {
      steps {
        withCredentials([
          string(credentialsId: 'API_GATEWAY_URL', variable: 'API_URL'),
          string(credentialsId: 'MASTER_KEY',      variable: 'MKEY')
        ]) {
          sh """
            docker build \\
              --build-arg VITE_API_URL=\${API_URL} \\
              --build-arg VITE_MASTER_KEY=\${MKEY} \\
              -t ${APP_IMAGE}:${IMAGE_TAG} \\
              -t ${APP_IMAGE}:latest \\
              ./deliver_management_system/BiteRush-app
          """
        }
      }
    }

    // ── 4. Push to DockerHub ──────────────────────────────────────────────────
    stage('Push to DockerHub') {
      steps {
        retry(3) {
          withCredentials([usernamePassword(
            credentialsId: 'dockerhub-credentials',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
          )]) {
            sh """
              echo "\${DOCKER_PASS}" | docker login -u "\${DOCKER_USER}" --password-stdin
              docker push ${APP_IMAGE}:${IMAGE_TAG}
              docker push ${APP_IMAGE}:latest
              docker logout
            """
          }
        }
      }
    }

    // ── 5. Deploy to Kubernetes ───────────────────────────────────────────────
    stage('Deploy to Kubernetes') {
      steps {
        sh """
          kubectl apply -f deliver_management_system/k8s/namespace.yaml

          sed 's|DOCKERHUB_USER|${DOCKERHUB_USER}|g; s|IMAGE_TAG|${IMAGE_TAG}|g' \\
            deliver_management_system/k8s/unified-app.yaml | kubectl apply -f -
        """
      }
    }

    // ── 6. Verify Rollout ─────────────────────────────────────────────────────
    stage('Verify Rollout') {
      steps {
        sh """
          kubectl rollout status deployment/bitrush-app -n ${K8S_NAMESPACE} --timeout=120s
          kubectl get pods -n ${K8S_NAMESPACE}
          kubectl get svc  -n ${K8S_NAMESPACE}
        """
      }
    }

    // ── 7. Cleanup ────────────────────────────────────────────────────────────
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
        echo "BUILD #${BUILD_NUMBER} DEPLOYED SUCCESSFULLY"
        echo "--------------------------------------------"
        echo "BiteRush App -> http://\${EC2_IP}:30176"
        echo "============================================"
      """
    }
    failure {
      sh """
        echo "Build failed - rolling back"
        kubectl rollout undo deployment/bitrush-app -n ${K8S_NAMESPACE} || true
      """
    }
  }
}
