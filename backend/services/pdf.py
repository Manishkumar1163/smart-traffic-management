import os
import csv
from datetime import datetime
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from backend.config.settings import settings
import qrcode

def generate_challan_pdf(violation: dict) -> str:
    """Generates a professional PDF challan for a violation."""
    pdf_name = f"challan_{violation.get('_id', 'UNK')}.pdf"
    pdf_path = settings.REPORTS_DIR / pdf_name
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=letter,
                            rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#0F172A'), # Slate 900
        alignment=1, # Centered
        spaceAfter=20
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.HexColor('#475569') # Slate 600
    )
    
    val_style = ParagraphStyle(
        'ValueStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor('#0F172A')
    )

    story = []
    
    # Header Banner
    banner_data = [
        [Paragraph("<font color='white'><b>TRAFFIC VIOLATION CHALLAN</b></font>", title_style)]
    ]
    banner_table = Table(banner_data, colWidths=[530], rowHeights=[45])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ef4444')), # Red warning header
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 20))
    
    # Details table
    status_color = "#10b981" if violation.get("status") == "paid" else "#f97316"
    status_html = f"<font color='{status_color}'><b>{violation.get('status', 'PENDING').upper()}</b></font>"
    
    data = [
        [Paragraph("Challan ID:", label_style), Paragraph(str(violation.get("_id", "N/A")), val_style)],
        [Paragraph("License Plate:", label_style), Paragraph(violation.get("plate", "UNKNOWN"), val_style)],
        [Paragraph("Violation Type:", label_style), Paragraph(violation.get("type", "N/A").replace("_", " ").title(), val_style)],
        [Paragraph("Penalty Amount:", label_style), Paragraph(f"Rs. {violation.get('fine', 0)}", val_style)],
        [Paragraph("Date & Time:", label_style), Paragraph(violation.get("time", "N/A"), val_style)],
        [Paragraph("Location:", label_style), Paragraph(violation.get("location", "N/A").title(), val_style)],
        [Paragraph("Payment Status:", label_style), Paragraph(status_html, val_style)]
    ]
    
    details_table = Table(data, colWidths=[150, 380], rowHeights=[25]*7)
    details_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 20))
    
    # Generate real QR Code image
    qr_img_path = settings.SCREENSHOTS_DIR / f"qr_{violation.get('_id', 'UNK')}.png"
    try:
        qr = qrcode.QRCode(version=1, box_size=3, border=1)
        # Point QR to payment page on frontend
        payment_url = f"http://localhost:3000/pay/{violation.get('_id', 'UNK')}"
        qr.add_data(payment_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_img.save(str(qr_img_path))
        qr_flowable = Image(str(qr_img_path), width=80, height=80)
    except Exception as e:
        log.error(f"Failed to generate QR Code for PDF: {e}")
        qr_flowable = "[QR Code Generation Failed]"

    # QR Code layout
    qr_data = [
        [Paragraph("<b>SCAN QR TO PAY ONLINE</b>", label_style)],
        [qr_flowable],
    ]
    qr_table = Table(qr_data, colWidths=[200], rowHeights=[20, 85])
    qr_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(qr_table)
    story.append(Spacer(1, 30))
    
    # Footer info
    footer_text = Paragraph(
        "<font size='8' color='#64748B'>This is an electronically generated document by Smart Traffic Management System AI Core. No signature is required.</font>",
        val_style
    )
    story.append(footer_text)
    
    doc.build(story)
    
    # Optional clean up of temporary QR code image file
    try:
        if qr_img_path.exists():
            # Keep it or remove it. Leaving it is fine as proof.
            pass
    except Exception:
        pass

    return str(pdf_path)

def generate_report_pdf(violations_list: list, report_type: str) -> str:
    """Generates a summary report PDF of violations (daily/weekly/monthly)."""
    pdf_name = f"report_{report_type}_{datetime.now().strftime('%Y%m%d')}.pdf"
    pdf_path = settings.REPORTS_DIR / pdf_name
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=letter,
                            rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        alignment=1,
        spaceAfter=15
    )
    
    header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.white
    )
    
    row_style = ParagraphStyle(
        'TableRow',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#1E293B')
    )
    
    story = []
    
    story.append(Paragraph(f"Smart Traffic - {report_type.upper()} SUMMARY REPORT", title_style))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", row_style))
    story.append(Spacer(1, 15))
    
    # Table headers
    headers = ["Plate", "Type", "Fine (Rs)", "Time", "Location", "Status"]
    table_data = [[Paragraph(h, header_style) for h in headers]]
    
    total_fine = 0
    paid_count = 0
    
    for v in violations_list:
        total_fine += v.get("fine", 0)
        if v.get("status") == "paid":
            paid_count += 1
            
        row = [
            Paragraph(v.get("plate", "N/A"), row_style),
            Paragraph(v.get("type", "N/A").replace("_", " ").title(), row_style),
            Paragraph(str(v.get("fine", 0)), row_style),
            Paragraph(v.get("time", "N/A")[:16], row_style),
            Paragraph(v.get("location", "N/A"), row_style),
            Paragraph(v.get("status", "N/A").upper(), row_style)
        ]
        table_data.append(row)
        
    t = Table(table_data, colWidths=[80, 110, 60, 120, 90, 70])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Summary Info
    summary_html = f"<b>Total Violations:</b> {len(violations_list)} | <b>Total Penalties:</b> Rs. {total_fine} | <b>Settled:</b> {paid_count} cases"
    story.append(Paragraph(summary_html, styles['Normal']))
    
    doc.build(story)
    return str(pdf_path)

def generate_report_csv(violations_list: list, report_type: str) -> str:
    """Generates a summary report in CSV format."""
    csv_name = f"report_{report_type}_{datetime.now().strftime('%Y%m%d')}.csv"
    csv_path = settings.REPORTS_DIR / csv_name
    
    with open(csv_path, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Challan ID", "License Plate", "Violation Type", "Fine Amount", "Timestamp", "Location", "Status"])
        for v in violations_list:
            writer.writerow([
                str(v.get("_id", "")),
                v.get("plate", ""),
                v.get("type", ""),
                v.get("fine", 0),
                v.get("time", ""),
                v.get("location", ""),
                v.get("status", "")
            ])
            
    return str(csv_path)
