# Simple QR Code Validation System

## How It Works

1. **QR codes now contain simple URLs** like: `yoursite.com/validate/ticket-id-123`
2. **Staff scan with regular phone camera** - no special app needed
3. **Camera opens the validation page** automatically
4. **Staff enters password** to validate the ticket
5. **System shows validation result** with ticket details

## Setup Instructions

### 1. Validation 

The validation  is hardcoded as: **`Gorki123`**

### 2. For Door Staff

Give your staff this simple process:

1. **Point phone camera at QR code**
2. **Tap the notification/link** that appears
3. **Enter the validation password**
4. **Click "Validar Ingresso"**
5. **Check the result**:
   - ✅ **Green** = Let them in
   - ⚠️ **Yellow** = Already used (don't let in)
   - ❌ **Red** = Invalid ticket (don't let in)

### 3. Password Security

- Change the default password in production
- Only give the password to authorized door staff
- The password prevents customers from validating their own tickets

## Benefits

- **No special apps needed** - works with any phone camera
- **Simple for staff** - just scan and enter password
- **Secure** - password prevents self-validation
- **Works offline** - once page loads, validation is instant
- **Clear results** - obvious green/yellow/red status

## URLs

- Validation page: `/validate/[ticketId]`
- API endpoint: `/api/tickets/validate-with-password`
