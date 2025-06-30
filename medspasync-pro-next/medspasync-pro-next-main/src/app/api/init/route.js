import { NextResponse } from 'next/server';
import proNextKeyVaultManager from '../../../../lib/azure-keyvault';

export async function GET() {
  try {
    // Initialize Azure Key Vault
    const success = await proNextKeyVaultManager.initialize();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Pro-Next (Demo) Azure Key Vault initialized successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to initialize Azure Key Vault, using environment variables' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error initializing Azure Key Vault:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error initializing Azure Key Vault',
      error: error.message 
    }, { status: 500 });
  }
} 