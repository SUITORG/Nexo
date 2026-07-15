import asyncio
import qrcode
import os
from datetime import datetime

async def generate_qr():
    print("Starting WhatsApp Web QR code generator...")
    print("This will generate a QR code image you can scan with WhatsApp.")
    print("Note: You need to scan this QR code within 30 seconds.")
    print("-" * 60)
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    # WhatsApp Web URL format
    # The actual QR code content is provided by WhatsApp Web client
    # For now, we'll create a placeholder and explain the process
    
    print("\nTo connect WhatsApp Web:")
    print("1. Open WhatsApp on your phone")
    print("2. Go to Settings > Linked Devices")
    print("3. Tap 'Link a Device'")
    print("4. Scan the QR code that appears in your terminal")
    print("\nThe QR code is shown in the terminal when you run:")
    print("  npx -y wweb-mcp -t command")
    print("\nThe QR code appears as ASCII art in the terminal output.")
    print("Look for the block of ▄ and █ characters.")
    
    # Generate a sample QR code image as demonstration
    qr.add_data("https://web.whatsapp.com")
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"whatsapp-web-qr-{timestamp}.png"
    img.save(filename)
    
    print(f"\nSample QR code saved to: {filename}")
    print("This is just a demonstration. The actual QR code comes from WhatsApp Web client.")
    
    return filename

if __name__ == "__main__":
    asyncio.run(generate_qr())