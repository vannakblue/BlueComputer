import qrcode
import io
import base64
from decimal import Decimal
import binascii

def crc16_ccitt(data: str) -> str:
    """Computes standard EMVCo CRC-16 CCITT (0xFFFF polynomial 0x1021)"""
    crc = 0xFFFF
    for ch in data.encode('utf-8'):
        crc = ((crc << 8) & 0xFFFF) ^ binascii.crc_hqx(bytes([ch]), crc >> 8)
    return f"{crc:04X}"

def build_emvco_khqr_string(merchant_name="BLUE COMPUTER", 
                            account_id="bluecomputer@abab", 
                            amount=0.00, 
                            currency="USD", 
                            bill_number="BC-1001", 
                            city="Phnom Penh") -> str:
    """
    Constructs an authentic National Bank of Cambodia (NBC) Bakong KHQR string
    according to the EMVCo standard.
    """
    def emv_tag(tag: str, value: str) -> str:
        return f"{tag}{len(value):02d}{value}"

    payload = ""
    # Tag 00: Format Indicator
    payload += emv_tag("00", "01")
    # Tag 01: Point of Initiation (12 = Dynamic QR)
    payload += emv_tag("01", "12")
    
    # Tag 29: Merchant Account Information (Bakong)
    merchant_info = emv_tag("00", account_id)
    payload += emv_tag("29", merchant_info)
    
    # Tag 52: Merchant Category Code (5732 = Electronics / Computer Stores)
    payload += emv_tag("52", "5732")
    
    # Tag 53: Transaction Currency (840 = USD, 116 = KHR)
    currency_code = "840" if currency.upper() == "USD" else "116"
    payload += emv_tag("53", currency_code)
    
    # Tag 54: Transaction Amount
    amt_str = f"{float(amount):.2f}" if currency.upper() == "USD" else f"{int(amount)}"
    payload += emv_tag("54", amt_str)
    
    # Tag 58: Country Code (KH)
    payload += emv_tag("58", "KH")
    
    # Tag 59: Merchant Name
    payload += emv_tag("59", merchant_name)
    
    # Tag 60: Merchant City
    payload += emv_tag("60", city)
    
    # Tag 62: Additional Data Field (Bill Number / Order Number)
    add_data = emv_tag("01", bill_number)
    payload += emv_tag("62", add_data)
    
    # Tag 63: CRC placeholder
    payload_for_crc = payload + "6304"
    crc = crc16_ccitt(payload_for_crc)
    
    return payload_for_crc + crc

def generate_khqr_image_base64(khqr_string: str) -> str:
    """
    Generates a high-contrast QR code image returned as a base64 Data URI
    """
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(khqr_string)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0b1120", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_b64}"
