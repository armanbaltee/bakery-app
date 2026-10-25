# 🧁 Bakery App - Serverless Monorepo

Welcome to the **Bakery App** full-stack serverless monorepo! This workspace is divided into three decoupled projects with global AWS CDK infrastructure:

1. **`admin`** (`apps/admin`): Admin Portal frontend for managing orders, products, categories, users, and reports.
2. **`user`** (`apps/user`): Client/Storefront frontend for customers to browse cakes, customize products, add to cart, and checkout with COD, JazzCash, or EasyPaisa.
3. **`backend`** (`apps/backend`): Serverless REST API powered by **Node.js TypeScript**, **Hono**, and **AWS Lambda**.
4. **`infra`** (`infra/`): Global **AWS CDK** infrastructure stack that deploys all 3 projects together to AWS.

---

## 🏗️ Architecture & Projects

| Project | Type | Tech Stack | Local Port / Cloud Resource | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`admin`** | Frontend | Angular 21 (Signals & Standalone) | `4201` / S3 + CloudFront | Admin dashboard, order fulfillment, product management, metrics |
| **`user`** | Frontend | Angular 21 (Signals & Standalone) | `4200` / S3 + CloudFront | Customer storefront, cake customizer, cart, checkout, order tracking |
| **`backend`** | Backend | Node.js TypeScript + Hono | `3000` / AWS Lambda + HTTP API Gateway | REST API (`/api`), JWT Auth, Payments, S3 Presigned URLs |
| **`database`** | Database | Amazon DynamoDB | Single-Table Design (`BakeryTable`) | Pay-as-you-go serverless NoSQL storage with GSI1 |
| **`infra`** | DevOps | AWS CDK v2 (TypeScript) | CloudFormation | One-command global deploy for all 3 projects |

---

## ⚡ Pay-As-You-Go Architecture

- **Amazon DynamoDB**: `BillingMode.PAY_PER_REQUEST` (Zero fixed cost when idle).
- **AWS Lambda**: Sub-second execution on demand, handles `/api/*` traffic via HTTP API Gateway.
- **Amazon S3 & CloudFront**: Edge-cached static hosting for both Admin & User frontends, plus secure uploads bucket for product images.

---

## 🚀 Quick Start Commands

All commands can be run directly from the root:

### Running Applications in Development Mode

```bash
# 1. Run Serverless Backend API (http://localhost:3000/api)
npm run dev:backend

# 2. Run Admin Portal (http://localhost:4201)
npm run dev:admin

# 3. Run User Storefront (http://localhost:4200)
npm run dev:user

# Run all 3 projects concurrently:
npm run dev:all
```

### Seeding DynamoDB with Initial Data

```bash
npm run seed
```
Seeds initial admin account (`admin@bakery.com` / `admin123`), sample categories (Cakes, Pastries, Cupcakes, Breads, Cookies), and popular products with pricing, stock, and variations.

---

## ☁️ Global AWS CDK Deployment (Deploy All 3 Projects Together)

Prerequisites: Have your AWS credentials configured (`aws configure` or environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).

### 1. Build All 3 Projects
```bash
npm run build:all
```

### 2. Synthesize CloudFormation Template
```bash
npm run cdk:synth
```

### 3. Bootstrap CDK (First Time Only)
```bash
npm run cdk:bootstrap
```

### 4. Deploy All 3 in One Command
```bash
npm run deploy:all
```

This single command will:
1. Build `admin`, `user`, and `backend`.
2. Provision the **DynamoDB Single-Table** (`BakeryTable`).
3. Provision the **S3 Uploads Bucket** with CORS.
4. Deploy the **AWS Lambda function** (`bakery-backend-api`) and **HTTP API Gateway** (`/api/*`).
5. Provision **CloudFront + S3** for the Admin Portal and upload the compiled assets.
6. Provision **CloudFront + S3** for the User Storefront, routing `/api/*` to API Gateway.
7. Output live CloudFront & API Gateway URLs in your console!
