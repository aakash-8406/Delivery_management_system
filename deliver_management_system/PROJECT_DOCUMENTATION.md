# Delivery Management System — Full Project Documentation

## 1. Project Overview - SmartQueue_2024

A full-stack food delivery platform with two React frontends backed by AWS serverless infrastructure, containerized with Docker, orchestrated by Kubernetes, and automated via Jenkins CI/CD.

| App | Purpose | Prod Port | Local Port |
|-----|---------|-----------|------------|
| customers-app | Browse restaurants, place orders, track status | 30174 | 5174 |
| restaurant-app | Manage menus, view/update incoming orders | 30175 | 5175 |

---

## 2. System Architecture

```
Developer
    │
    └── git push → GitHub (no .env, no secrets)
                        │
                        ▼
                   Jenkins (CI/CD)
                        │
          ┌─────────────┼─────────────┐
          │             │             │
    Pull secrets   Build Docker   Deploy to
    from Jenkins   Images         Kubernetes
    Credentials         │
          │         DockerHub
    API_GATEWAY_URL     │
    MASTER_KEY     ─────┘
    dockerhub-creds

AWS Serverless Backend:
    API Gateway (HTTP API)
          │
          ├── /register, /login
          ├── /restaurants, /restaurants/{id}
          ├── /placeOrder, /getOrders, /updateOrder/{id}
          │
          └── Lambda Functions (Node.js 20)
                    │
                    └── DynamoDB
                          ├── Orders table
                          └── Restaurants table
```

---

## 3. Project Structure

```
Delivery_management_system/            ← GitHub repo root
└── deliver_management_system/
    ├── Jenkinsfile                     ← CI/CD pipeline
    ├── .gitignore                      ← Blocks .env, node_modules, dist, tf state
    ├── .gitattributes                  ← LF line endings for Linux builds
    │
    ├── customers-app/
    │   ├── Dockerfile                  ← Multi-stage: Node build → Nginx serve
    │   ├── nginx.conf                  ← SPA fallback routing
    │   ├── .env.example                ← Env var template (safe to commit)
    │   └── src/
    │       ├── pages/                  ← Home, Menu, Cart, MyOrders, Login
    │       ├── components/             ← FoodCard, RestaurantCard, Navbar, Loader
    │       ├── context/                ← AuthContext, CartContext
    │       ├── services/api.js         ← Real API + mock fallback
    │       └── data/mockData.js        ← Local mock data
    │
    ├── restaurant-app/
    │   ├── Dockerfile
    │   ├── nginx.conf
    │   ├── .env.example
    │   └── src/
    │       ├── pages/                  ← Dashboard, MenuPage, MasterAdmin, Login
    │       ├── components/             ← Charts, DashboardCards, Modal, Navbar
    │       ├── context/                ← AuthContext
    │       └── services/api.js         ← Real API + mock fallback
    │
    ├── infra/                          ← Terraform (AWS infrastructure as code)
    │   ├── main.tf                     ← DynamoDB, Lambda, API Gateway, IAM roles
    │   ├── variables.tf                ← Input variables
    │   ├── outputs.tf                  ← Outputs API Gateway URL
    │   └── lambda/                     ← Lambda source code
    │       ├── register/index.mjs
    │       ├── login/index.mjs
    │       ├── placeOrder/index.mjs
    │       ├── getOrders/index.mjs
    │       ├── updateOrder/index.mjs
    │       ├── getRestaurants/index.mjs
    │       ├── getRestaurantById/index.mjs
    │       ├── updateRestaurant/index.mjs
    │       └── deleteRestaurant/index.mjs
    │
    └── k8s/                            ← Kubernetes manifests
        ├── namespace.yaml              ← Creates 'smartqueue' namespace
        ├── customer-app.yaml           ← Deployment + NodePort 30174
        └── restaurant-app.yaml         ← Deployment + NodePort 30175
```

---

## 4. Frontend Applications

### customers-app (React 19 + Vite + Tailwind CSS)

| Page | Route | Description |
|------|-------|-------------|
| Home | / | Lists all restaurants, search by name/cuisine |
| Menu | /menu/:id | Restaurant menu with food cards, add to cart |
| Cart | /cart | Review items, enter delivery address, place order |
| MyOrders | /my-orders | Shows only the logged-in user's own orders |
| Login | /login | Email/password login and registration |
| NotFound | * | 404 fallback page |

### restaurant-app (React 19 + Vite + Tailwind CSS)

| Page | Route | Description |
|------|-------|-------------|
| Login | /login | Restaurant owner login |
| Dashboard | /dashboard | Live order management, status updates |
| MenuPage | /menu | Add/edit/delete menu items |
| MasterAdmin | /master | Manage all restaurants (master key required) |

### API Service Logic (both apps)

```js
// services/api.js
const HAS_BACKEND = !!import.meta.env.VITE_API_URL;

// If VITE_API_URL is set → calls real AWS API Gateway
// If not set           → falls back to mockApi.js (localStorage)
```

This means both apps work fully offline in local dev without any backend.

---

## 5. Backend — AWS Serverless

All backend logic runs as individual Lambda functions triggered by API Gateway HTTP routes.

| Method | Route | Lambda | Description |
|--------|-------|--------|-------------|
| POST | /register | register | Create new user account |
| POST | /login | login | Authenticate, return JWT token |
| GET | /restaurants | getRestaurants | List all restaurants |
| GET | /restaurants/{id} | getRestaurantById | Get single restaurant + menu |
| PATCH | /restaurants/{id} | updateRestaurant | Update restaurant details |
| DELETE | /restaurants/{id} | deleteRestaurant | Remove a restaurant |
| POST | /placeOrder | placeOrder | Create a new order in DynamoDB |
| GET | /getOrders | getOrders | Fetch orders (filtered by userId) |
| PATCH | /updateOrder/{id} | updateOrder | Update order status |

### DynamoDB Tables

| Table | Partition Key | Used By |
|-------|--------------|---------|
| Orders | id (String) | placeOrder, getOrders, updateOrder |
| Restaurants | restaurantId (String) | all restaurant lambdas |

### IAM

A single Lambda execution role is created with:
- `AWSLambdaBasicExecutionRole` — for CloudWatch logging
- Custom policy — DynamoDB read/write on both tables

---

## 6. Infrastructure — Terraform

Terraform provisions all AWS resources from code.

```bash
cd deliver_management_system/infra

terraform init
terraform plan
terraform apply
```

After apply, the output gives you the API Gateway URL:

```
api_gateway_url = "https://xxxxxx.execute-api.ap-southeast-1.amazonaws.com"
```

This URL goes into Jenkins as the `API_GATEWAY_URL` credential.

### Key variables (variables.tf)

| Variable | Default | Description |
|----------|---------|-------------|
| aws_region | ap-southeast-1 | AWS region |
| project | smartqueue | Prefix for all resource names |
| dynamodb_table_name | Orders | Orders DynamoDB table |
| restaurants_table_name | Restaurants | Restaurants DynamoDB table |
| lambda_runtime | nodejs20.x | Lambda runtime |
| jwt_secret | (sensitive) | JWT signing secret |
| master_key | (sensitive) | Master admin key |

---

## 7. Containerization — Docker

Both apps use identical multi-stage Dockerfiles.

### Stage 1 — Build (node:20-alpine)

```dockerfile
ARG VITE_API_URL
ARG VITE_MASTER_KEY
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_MASTER_KEY=${VITE_MASTER_KEY}" >> .env && \
    npm run build
```

- Secrets are passed as `--build-arg` from Jenkins at build time
- They get baked into the static JS bundle by Vite
- The .env file is never stored in the image layer after build

### Stage 2 — Serve (nginx:alpine)

```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

- Only the compiled static files are copied into the final image
- Nginx serves the SPA and handles client-side routing fallback
- Final image is minimal — no Node.js, no source code, no secrets

### Docker Images

| Image | Tag |
|-------|-----|
| aakash985/bitrush-customer | BUILD_NUMBER / latest |
| aakash985/smartqueue-restaurant | BUILD_NUMBER / latest |

---

## 8. Kubernetes Deployment

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: smartqueue
```

All resources live in the `smartqueue` namespace.

### Deployment Strategy

Both apps use RollingUpdate with zero downtime:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # one extra pod during update
    maxUnavailable: 0  # never kill old pod before new one is ready
```

### Replicas and Resources

```yaml
replicas: 2

resources:
  requests:
    cpu: "100m"
    memory: "64Mi"
  limits:
    cpu: "250m"
    memory: "128Mi"
```

### Health Checks

```yaml
livenessProbe:           # restart container if unhealthy
  httpGet:
    path: /
    port: 80
  initialDelaySeconds: 10
  periodSeconds: 15

readinessProbe:          # only send traffic when ready
  httpGet:
    path: /
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Services (NodePort)

| App | NodePort | Access URL |
|-----|----------|------------|
| customer-app-svc | 30174 | http://EC2_IP:30174 |
| restaurant-app-svc | 30175 | http://EC2_IP:30175 |

### Image Placeholder Substitution

The k8s YAML files use placeholders that Jenkins replaces at deploy time:

```yaml
image: DOCKERHUB_USER/bitrush-customer:IMAGE_TAG
```

Jenkins replaces them using `sed` before applying:

```bash
sed 's|DOCKERHUB_USER|aakash985|g; s|IMAGE_TAG|9|g' \
  k8s/customer-app.yaml | kubectl apply -f -
```

---

## 9. CI/CD Pipeline — Jenkins

The `Jenkinsfile` defines a declarative pipeline with 6 stages.

### Pipeline Stages

```
┌─────────────┐
│  1. Checkout │  git pull from GitHub
└──────┬──────┘
       │
┌──────▼──────────┐
│ 2. Build Images  │  docker build (parallel for both apps)
│  (parallel)      │  secrets injected via --build-arg
└──────┬──────────┘
       │
┌──────▼──────────┐
│ 3. Push to       │  docker push to DockerHub
│    DockerHub     │  both :BUILD_NUMBER and :latest tags
└──────┬──────────┘
       │
┌──────▼──────────┐
│ 4. Deploy to     │  kubectl apply namespace + deployments
│    Kubernetes    │  sed replaces image placeholders
└──────┬──────────┘
       │
┌──────▼──────────┐
│ 5. Verify        │  kubectl rollout status (waits 120s)
│    Rollout       │  kubectl get pods/svc
└──────┬──────────┘
       │
┌──────▼──────────┐
│ 6. Cleanup       │  docker image prune -f
└─────────────────┘
```

### Post Actions

| Result | Action |
|--------|--------|
| success | Prints EC2 IP and access URLs |
| failure | Runs `kubectl rollout undo` on both deployments |

### Environment Variables (Jenkinsfile)

```groovy
environment {
  DOCKERHUB_USER   = "aakash985"
  CUSTOMER_IMAGE   = "aakash985/bitrush-customer"
  RESTAURANT_IMAGE = "aakash985/smartqueue-restaurant"
  IMAGE_TAG        = "${BUILD_NUMBER}"   // unique per build
  K8S_NAMESPACE    = "smartqueue"
}
```

---

## 10. Secret Management

Secrets are NEVER stored in GitHub. They flow like this:

```
Jenkins Credentials Store
        │
        ├── API_GATEWAY_URL  ──► --build-arg VITE_API_URL   ──► baked into JS bundle
        ├── MASTER_KEY       ──► --build-arg VITE_MASTER_KEY ──► baked into JS bundle
        └── dockerhub-creds  ──► docker login ──► docker push
```

### Files safe to commit

| File | Why safe |
|------|---------|
| .env.example | Contains only placeholder values, no real secrets |
| Jenkinsfile | References credential IDs, not actual values |
| k8s/*.yaml | Contains image placeholders, not secrets |
| infra/*.tf | Variables marked sensitive, no hardcoded secrets |

### Files blocked by .gitignore

```
.env
.env.local
.env.production
node_modules/
dist/
infra/terraform.tfstate
infra/terraform.tfstate.backup
infra/*.tfvars
```

---

## 11. Full CI/CD Workflow (Step by Step)

```
Step 1: Developer writes code locally
        └── Uses mock API (no real backend needed)
        └── Tests on localhost:5174 and localhost:5175

Step 2: git push to GitHub
        └── .env files are blocked by .gitignore
        └── Only source code, Dockerfiles, k8s manifests pushed

Step 3: Jenkins detects push (webhook or manual trigger)
        └── Pipeline starts automatically

Step 4: Stage 1 — Checkout
        └── Jenkins pulls latest code from GitHub
        └── git log confirms the commit

Step 5: Stage 2 — Build Images (runs in parallel)
        └── Jenkins reads API_GATEWAY_URL from credentials store
        └── Jenkins reads MASTER_KEY from credentials store
        └── docker build --build-arg injects secrets into Vite build
        └── Vite compiles React app with API URL embedded in JS
        └── Final Docker image = static files served by Nginx
        └── Two images built simultaneously:
              aakash985/bitrush-customer:BUILD_NUMBER
              aakash985/smartqueue-restaurant:BUILD_NUMBER

Step 6: Stage 3 — Push to DockerHub
        └── Jenkins reads dockerhub-credentials
        └── docker login with username/password
        └── Pushes both images with BUILD_NUMBER tag and latest tag
        └── docker logout

Step 7: Stage 4 — Deploy to Kubernetes
        └── kubectl apply -f k8s/namespace.yaml
        └── sed replaces DOCKERHUB_USER and IMAGE_TAG placeholders
        └── kubectl apply deploys new pods with new image
        └── RollingUpdate ensures zero downtime

Step 8: Stage 5 — Verify Rollout
        └── kubectl rollout status waits up to 120s
        └── Confirms all pods are Running
        └── Lists pods and services

Step 9: Stage 6 — Cleanup
        └── docker image prune removes dangling images from Jenkins host

Step 10: Post — Success
        └── Prints live URLs:
              customer-app   → http://EC2_IP:30174
              restaurant-app → http://EC2_IP:30175

        Post — Failure
        └── kubectl rollout undo reverts both deployments to previous version
```

---

## 12. Local Development

### Prerequisites
- Node.js 20+
- npm

### Run customers-app

```bash
cd deliver_management_system/customers-app
npm install
npm run dev
# Opens at http://localhost:5174
```

### Run restaurant-app

```bash
cd deliver_management_system/restaurant-app
npm install
npm run dev
# Opens at http://localhost:5175
```

No `.env` needed for local dev. Both apps automatically fall back to mock data (localStorage) when `VITE_API_URL` is not set.

### Login credentials (mock mode)

| App | Email | Password |
|-----|-------|----------|
| customers-app | customer@bitrush.com | customer123 |
| restaurant-app | (any registered user) | (password set on register) |

---

## 13. API Reference

All endpoints are prefixed with the API Gateway base URL.

### Auth

```
POST /register
Body: { name, email, password }
Response: { user: { id, name, email }, token }

POST /login
Body: { email, password }
Response: { user: { id, name, email }, token }
```

### Restaurants

```
GET  /restaurants
Response: { data: [ ...restaurants ] }

GET  /restaurants/{id}
Response: { data: { restaurantId, name, cuisine, menu, ... } }

PATCH /restaurants/{id}
Headers: Authorization: Bearer <token>
Body: { name, cuisine, ... }

DELETE /restaurants/{id}
Headers: x-master-key: <MASTER_KEY>
```

### Orders

```
POST /placeOrder
Headers: Authorization: Bearer <token>
Body: { userId, customerName, restaurantId, items, totalAmount, deliveryAddress }
Response: { orderId, status: "ACCEPTED", ... }

GET /getOrders?userId=<userId>
Headers: Authorization: Bearer <token>
Response: { data: [ ...orders ] }   ← filtered to this user only

PATCH /updateOrder/{id}
Headers: Authorization: Bearer <token>
Body: { status }   ← ACCEPTED | DELAYED | REJECTED | DELIVERED
```

---

## 14. Jenkins Credentials Setup

Go to Jenkins → Manage Jenkins → Credentials → Global → Add Credential

| Credential ID | Type | Value |
|--------------|------|-------|
| API_GATEWAY_URL | Secret text | Your API Gateway URL from terraform output |
| MASTER_KEY | Secret text | Your master admin key |
| dockerhub-credentials | Username with password | DockerHub username + password/token |

These IDs must match exactly what is in the Jenkinsfile `credentialsId` fields.
