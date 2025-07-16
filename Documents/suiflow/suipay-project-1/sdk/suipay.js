// This file contains the JavaScript SDK for embedding payment functionality into other applications.

class SuiPay {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    async processPayment(paymentData) {
        try {
            const response = await fetch(`${this.apiUrl}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData),
            });
            return await response.json();
        } catch (error) {
            console.error('Error processing payment:', error);
            throw error;
        }
    }

    async getPaymentStatus(paymentId) {
        try {
            const response = await fetch(`${this.apiUrl}/payments/${paymentId}`, {
                method: 'GET',
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching payment status:', error);
            throw error;
        }
    }

    async handleWebhook(event) {
        // Implement webhook handling logic here
        console.log('Webhook event received:', event);
    }
}

export default SuiPay;