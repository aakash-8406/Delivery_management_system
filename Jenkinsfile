pipeline {
  agent any

  environment {
    CUSTOMER_IMAGE    = "bitrush-customer:${BUILD_NUMBER}"
    RESTAURANT_IMAGE  = "smartqueue-restaurant:${BUILD_NUMBER}"
    CUSTOMER_PORT     = "5174"
    RESTAURANT_PORT   = "5175"
    API_URL           = "https://kkidytruee.execute-api.ap-southeast-1.amazonaws.com"
    MASTER_KEY        = "MASTER-SMARTQUEUE-2024"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        sh 'echo "Branch: $(git rev-parse --abbrev-ref HEAD) | Commit: $(git rev-parse --short HEAD)"'
      }
    }

    stage('Build Docker Images') {
      parallel {

        stage('customer-app') {
          steps {
            sh """
              docker build \\
                --build-arg VITE_API_URL=${API_URL} \\
                --build-arg VITE_MASTER_KEY=${MASTER_KEY} \\
                -t ${CUSTOMER_IMAGE} \\
                ./customer-app
            """
          }
        }

        stage('restaurant-app') {
          steps {
            sh """
              docker build \\
                --build-arg VITE_API_URL=${API_URL} \\
                --build-arg VITE_MASTER_KEY=${MASTER_KEY} \\
                -t ${RESTAURANT_IMAGE} \\
                ./restaurant-app
            """
          }
        }

      }
    }

    stage('Deploy Containers') {
      steps {
        sh """
          # Stop and remove old containers
          docker rm -f bitrush-customer     || true
          docker rm -f smartqueue-restaurant || true

          # Start customer-app
          docker run -d \\
            --name bitrush-customer \\
            --restart unless-stopped \\
            -p ${CUSTOMER_PORT}:80 \\
            ${CUSTOMER_IMAGE}

          # Start restaurant-app
          docker run -d \\
            --name smartqueue-restaurant \\
            --restart unless-stopped \\
            -p ${RESTAURANT_PORT}:80 \\
            ${RESTAURANT_IMAGE}
        """
      }
    }

    stage('Health Check') {
      steps {
        sh """
          sleep 5
          curl -sf http://localhost:${CUSTOMER_PORT}   && echo "✅ customer-app  is UP"
          curl -sf http://localhost:${RESTAURANT_PORT} && echo "✅ restaurant-app is UP"
        """
      }
    }

    stage('Cleanup Old Images') {
      steps {
        sh "docker image prune -f || true"
      }
    }

  }

  post {
    success {
      echo """
        ============================================
        ✅  DEPLOYMENT SUCCESSFUL
        --------------------------------------------
        customer-app   → http://\$(curl -s ifconfig.me):${CUSTOMER_PORT}
        restaurant-app → http://\$(curl -s ifconfig.me):${RESTAURANT_PORT}
        ============================================
      """
    }
    failure {
      sh """
        echo "❌ Build failed — rolling back"
        docker rm -f bitrush-customer     || true
        docker rm -f smartqueue-restaurant || true
      """
    }
  }
}
