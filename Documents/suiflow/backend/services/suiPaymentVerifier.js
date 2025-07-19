import { SuiClient } from '@mysten/sui.js/client';
import dotenv from 'dotenv';
dotenv.config();

const suiClient = new SuiClient({ url: process.env.SUI_RPC_URL });

class SuiPaymentVerifier {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async verifyTransaction(transactionId) {
        // Logic to verify the transaction using the transactionId
        // This could involve making a request to a payment provider's API
        // and checking the status of the transaction.

        // Example placeholder logic:
        const response = await this._mockApiCall(transactionId);
        return response;
    }

    async _mockApiCall(transactionId) {
        // This is a mock function to simulate an API call to verify a transaction.
        // In a real implementation, this would make an HTTP request to the payment provider.

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    transactionId: transactionId,
                    status: 'verified',
                    timestamp: new Date(),
                });
            }, 1000);
        });
    }
}

// TODO: Implement Sui blockchain payment verification logic
export const verifySuiPayment = async (txnHash, expectedAmountSui, merchantAddress) => {
  try {
    console.log(`Verifying transaction: ${txnHash}`);
    console.log(`Expected amount: ${expectedAmountSui} SUI`);
    console.log(`Expected recipient: ${merchantAddress}`);
    
    const txn = await suiClient.getTransactionBlock({ 
      digest: txnHash,
      options: { showBalanceChanges: true, showEffects: true }
    });
    
    // Check if transaction exists and was successful
    if (!txn || txn.effects.status.status !== 'success') {
      console.log('Transaction not found or failed');
      return false;
    }
    
    // Convert expected amount to MIST for comparison
    const expectedAmountMist = Math.floor(parseFloat(expectedAmountSui) * 1_000_000_000);
    
    // Check balance changes to verify the payment
    const balanceChanges = txn.balanceChanges || [];
    
    // Look for a positive balance change for the merchant address
    const merchantBalanceChange = balanceChanges.find(change => 
      change.owner === merchantAddress && 
      change.coinType === '0x2::sui::SUI' &&
      parseInt(change.amount) > 0
    );
    
    if (!merchantBalanceChange) {
      console.log('No positive balance change found for merchant');
      return false;
    }
    
    const receivedAmount = parseInt(merchantBalanceChange.amount);
    console.log(`Received amount: ${receivedAmount} MIST (${receivedAmount / 1_000_000_000} SUI)`);
    
    // Allow for small differences due to gas costs
    const tolerance = 1_000_000; // 0.001 SUI tolerance
    const amountDifference = Math.abs(receivedAmount - expectedAmountMist);
    
    if (amountDifference > tolerance) {
      console.log(`Amount mismatch: expected ${expectedAmountMist}, received ${receivedAmount}`);
      return false;
    }
    
    console.log('Payment verification successful');
    return true;
  } catch (error) {
    console.error('Sui verification error:', error);
    return false;
  }
};

export default SuiPaymentVerifier;