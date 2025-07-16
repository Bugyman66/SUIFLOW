# API Documentation for Suipay Project

## Overview
The Suipay project provides a payment processing solution with a backend API and a frontend interface. This documentation outlines the available API endpoints, their request and response formats, and usage examples.

## Base URL
The base URL for the API is:
```
http://localhost:3000/api
```

## Endpoints

### 1. Process Payment
- **Endpoint:** `/payment/process`
- **Method:** POST
- **Description:** Initiates a payment process.
- **Request Body:**
  ```json
  {
    "amount": "number",
    "currency": "string",
    "paymentMethod": "string",
    "description": "string"
  }
  ```
- **Response:**
  - **Success (201):**
    ```json
    {
      "status": "success",
      "transactionId": "string",
      "message": "Payment processed successfully."
    }
    ```
  - **Error (400):**
    ```json
    {
      "status": "error",
      "message": "Invalid payment details."
    }
    ```

### 2. Retrieve Payment Status
- **Endpoint:** `/payment/status/:transactionId`
- **Method:** GET
- **Description:** Retrieves the status of a payment using the transaction ID.
- **Response:**
  - **Success (200):**
    ```json
    {
      "status": "string",
      "transactionId": "string",
      "amount": "number",
      "currency": "string",
      "message": "Payment status retrieved successfully."
    }
    ```
  - **Error (404):**
    ```json
    {
      "status": "error",
      "message": "Transaction not found."
    }
    ```

### 3. Webhook Notification
- **Endpoint:** `/webhook`
- **Method:** POST
- **Description:** Receives webhook notifications from payment providers.
- **Request Body:**
  ```json
  {
    "event": "string",
    "data": {
      "transactionId": "string",
      "status": "string"
    }
  }
  ```
- **Response:**
  - **Success (200):**
    ```json
    {
      "status": "success",
      "message": "Webhook received successfully."
    }
    ```
  - **Error (400):**
    ```json
    {
      "status": "error",
      "message": "Invalid webhook data."
    }
    ```

## Usage Examples

### Example 1: Process Payment
```bash
curl -X POST http://localhost:3000/api/payment/process \
-H "Content-Type: application/json" \
-d '{
  "amount": 100,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "description": "Payment for order #1234"
}'
```

### Example 2: Retrieve Payment Status
```bash
curl -X GET http://localhost:3000/api/payment/status/transactionId1234
```

### Example 3: Webhook Notification
```bash
curl -X POST http://localhost:3000/api/webhook \
-H "Content-Type: application/json" \
-d '{
  "event": "payment_completed",
  "data": {
    "transactionId": "transactionId1234",
    "status": "completed"
  }
}'
```

## Conclusion
This API documentation provides a comprehensive guide to the endpoints available in the Suipay project. For further assistance, please refer to the README.md file or contact the development team.