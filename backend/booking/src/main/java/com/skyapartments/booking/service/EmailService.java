package com.skyapartments.booking.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import com.skyapartments.booking.dto.ApartmentDTO;
import com.skyapartments.booking.dto.BookingDTO;
import com.skyapartments.booking.dto.UserDTO;

@Service
public class EmailService {
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    private final JavaMailSender mailSender;
    
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    public void sendBookingConfirmation(String toEmail, BookingDTO booking, 
                                       ApartmentDTO apartment, UserDTO user) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Booking Confirmation - Sky Apartments #" + booking.getId());
            helper.setText(buildConfirmationEmailContent(booking, apartment, user), true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
    
    public void sendBookingUpdate(String toEmail, BookingDTO booking, 
                                 ApartmentDTO apartment, UserDTO user) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Booking Updated - Sky Apartments #" + booking.getId());
            helper.setText(buildUpdateEmailContent(booking, apartment, user), true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
    
    public void sendBookingCancellation(String toEmail, BookingDTO booking, 
                                       ApartmentDTO apartment, UserDTO user) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Booking Cancelled - Sky Apartments #" + booking.getId());
            helper.setText(buildCancellationEmailContent(booking, apartment, user), true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
    
    private String buildConfirmationEmailContent(BookingDTO booking, ApartmentDTO apartment, UserDTO user) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6; 
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: white;
                    }
                    .header { 
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white; 
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .logo {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    .logo-icon {
                        font-size: 32px;
                        font-weight: bold;
                    }
                    .logo-text {
                        font-size: 24px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content { 
                        padding: 30px 20px;
                    }
                    .greeting {
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                    .details-box {
                        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%%, rgba(118, 75, 162, 0.05) 100%%);
                        border-left: 4px solid #667eea;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .detail { 
                        margin: 12px 0;
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .detail:last-child {
                        border-bottom: none;
                    }
                    .label { 
                        font-weight: 600;
                        color: #667eea;
                    }
                    .value {
                        color: #333;
                        text-align: right;
                    }
                    .highlight {
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        padding: 15px;
                        border-radius: 4px;
                        text-align: center;
                        font-size: 18px;
                        font-weight: 600;
                        margin: 20px 0;
                    }
                    .footer { 
                        background-color: #f9f9f9;
                        text-align: center; 
                        color: #666; 
                        font-size: 12px; 
                        padding: 20px;
                        border-top: 1px solid #eee;
                    }
                    .footer-logo {
                        color: #667eea;
                        font-weight: 600;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            <span class="logo-icon">🏢</span>
                            <span class="logo-text">Sky Apartments</span>
                        </div>
                        <h1>Booking Confirmed!</h1>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">
                            <p>Dear %s,</p>
                            <p>Your booking has been successfully confirmed. We're excited to host you!</p>
                        </div>
                        
                        <div class="details-box">
                            <div class="detail">
                                <span class="label">Booking Number:</span>
                                <span class="value">#%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Apartment:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Check-in:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Check-out:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Guests:</span>
                                <span class="value">%d</span>
                            </div>
                            <div class="detail">
                                <span class="label">Status:</span>
                                <span class="value">%s</span>
                            </div>
                        </div>
                        
                        <div class="highlight">
                            Total Cost: $%.2f
                        </div>
                        
                        <p style="margin-top: 30px; color: #666;">
                            We hope you enjoy your stay at Sky Apartments! If you have any questions, 
                            feel free to contact us.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated email, please do not reply to this message.</p>
                        <div class="footer-logo">Sky Apartments</div>
                    </div>
                </div>
            </body>
            </html>
            """,
            user.getName() != null ? user.getName() : "Guest",
            booking.getId(),
            apartment.getName() != null ? apartment.getName() : "Apartment",
            booking.getStartDate(),
            booking.getEndDate(),
            booking.getGuests(),
            booking.getState(),
            booking.getCost()
        );
    }
    
    private String buildUpdateEmailContent(BookingDTO booking, ApartmentDTO apartment, UserDTO user) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6; 
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: white;
                    }
                    .header { 
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white; 
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .logo {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    .logo-icon {
                        font-size: 32px;
                        font-weight: bold;
                    }
                    .logo-text {
                        font-size: 24px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content { 
                        padding: 30px 20px;
                    }
                    .greeting {
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                    .alert-box {
                        background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%%, rgba(255, 193, 7, 0.1) 100%%);
                        border-left: 4px solid #ff9800;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .details-box {
                        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%%, rgba(118, 75, 162, 0.05) 100%%);
                        border-left: 4px solid #667eea;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .detail { 
                        margin: 12px 0;
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .detail:last-child {
                        border-bottom: none;
                    }
                    .label { 
                        font-weight: 600;
                        color: #667eea;
                    }
                    .value {
                        color: #333;
                        text-align: right;
                    }
                    .highlight {
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        padding: 15px;
                        border-radius: 4px;
                        text-align: center;
                        font-size: 18px;
                        font-weight: 600;
                        margin: 20px 0;
                    }
                    .footer { 
                        background-color: #f9f9f9;
                        text-align: center; 
                        color: #666; 
                        font-size: 12px; 
                        padding: 20px;
                        border-top: 1px solid #eee;
                    }
                    .footer-logo {
                        color: #667eea;
                        font-weight: 600;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            <span class="logo-icon">🏢</span>
                            <span class="logo-text">Sky Apartments</span>
                        </div>
                        <h1>Booking Updated</h1>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">
                            <p>Dear %s,</p>
                            <p>Your booking has been successfully updated.</p>
                        </div>
                        
                        <div class="alert-box">
                            <strong>📝 Important:</strong> The details of your booking have been modified. 
                            Please review the updated information below.
                        </div>
                        
                        <div class="details-box">
                            <div class="detail">
                                <span class="label">Booking Number:</span>
                                <span class="value">#%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Apartment:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Check-in:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Check-out:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Guests:</span>
                                <span class="value">%d</span>
                            </div>
                            <div class="detail">
                                <span class="label">Status:</span>
                                <span class="value">%s</span>
                            </div>
                        </div>
                        
                        <div class="highlight">
                            Total Cost: $%.2f
                        </div>
                        
                        <p style="margin-top: 30px; color: #666;">
                            If you have any questions about these changes or need further assistance, 
                            please don't hesitate to contact us.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated email, please do not reply to this message.</p>
                        <div class="footer-logo">Sky Apartments</div>
                    </div>
                </div>
            </body>
            </html>
            """,
            user.getName() != null ? user.getName() : "Guest",
            booking.getId(),
            apartment.getName() != null ? apartment.getName() : "Apartment",
            booking.getStartDate(),
            booking.getEndDate(),
            booking.getGuests(),
            booking.getState(),
            booking.getCost()
        );
    }
    
    private String buildCancellationEmailContent(BookingDTO booking, ApartmentDTO apartment, UserDTO user) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6; 
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: white;
                    }
                    .header { 
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white; 
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .logo {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    .logo-icon {
                        font-size: 32px;
                        font-weight: bold;
                    }
                    .logo-text {
                        font-size: 24px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content { 
                        padding: 30px 20px;
                    }
                    .greeting {
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                    .alert-box {
                        background: linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%%, rgba(229, 57, 53, 0.1) 100%%);
                        border-left: 4px solid #f44336;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .details-box {
                        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%%, rgba(118, 75, 162, 0.05) 100%%);
                        border-left: 4px solid #667eea;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .detail { 
                        margin: 12px 0;
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .detail:last-child {
                        border-bottom: none;
                    }
                    .label { 
                        font-weight: 600;
                        color: #667eea;
                    }
                    .value {
                        color: #333;
                        text-align: right;
                    }
                    .cancelled-badge {
                        background: #f44336;
                        color: white;
                        padding: 15px;
                        border-radius: 4px;
                        text-align: center;
                        font-size: 18px;
                        font-weight: 600;
                        margin: 20px 0;
                    }
                    .footer { 
                        background-color: #f9f9f9;
                        text-align: center; 
                        color: #666; 
                        font-size: 12px; 
                        padding: 20px;
                        border-top: 1px solid #eee;
                    }
                    .footer-logo {
                        color: #667eea;
                        font-weight: 600;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            <span class="logo-icon">🏢</span>
                            <span class="logo-text">Sky Apartments</span>
                        </div>
                        <h1>Booking Cancelled</h1>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">
                            <p>Dear %s,</p>
                            <p>Your booking has been cancelled as requested.</p>
                        </div>
                        
                        <div class="alert-box">
                            <strong>⚠️ Cancellation Confirmed:</strong> This booking is no longer active. 
                            If this was a mistake, please contact us immediately.
                        </div>
                        
                        <div class="details-box">
                            <div class="detail">
                                <span class="label">Booking Number:</span>
                                <span class="value">#%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Apartment:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Check-in:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Check-out:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Guests:</span>
                                <span class="value">%d</span>
                            </div>
                        </div>
                        
                        <div class="cancelled-badge">
                            Status: CANCELLED
                        </div>
                        
                        <p style="margin-top: 30px; color: #666;">
                            We're sorry to see you go. If you cancelled by mistake or would like to make 
                            a new booking, we'd love to host you at Sky Apartments in the future.
                        </p>
                        
                        <p style="color: #666;">
                            If you have any questions about refunds or need assistance, please contact us.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated email, please do not reply to this message.</p>
                        <div class="footer-logo">Sky Apartments</div>
                    </div>
                </div>
            </body>
            </html>
            """,
            user.getName() != null ? user.getName() : "Guest",
            booking.getId(),
            apartment.getName() != null ? apartment.getName() : "Apartment",
            booking.getStartDate(),
            booking.getEndDate(),
            booking.getGuests()
        );
    }

    public void sendContactMessage(String name, String email, String subject, String message) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo("skyapartmentsmad@gmail.com");
            helper.setReplyTo(email); // Para poder responder directamente al usuario
            helper.setSubject("Contact Form: " + subject);
            helper.setText(buildContactEmailContent(name, email, subject, message), true);
            
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to send contact email", e);
        }
    }

    private String buildContactEmailContent(String name, String email, String subject, String message) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6; 
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: white;
                    }
                    .header { 
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white; 
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .logo {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    .logo-icon {
                        font-size: 32px;
                        font-weight: bold;
                    }
                    .logo-text {
                        font-size: 24px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content { 
                        padding: 30px 20px;
                    }
                    .info-box {
                        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%%, rgba(118, 75, 162, 0.05) 100%%);
                        border-left: 4px solid #667eea;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .detail { 
                        margin: 12px 0;
                        display: flex;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .detail:last-child {
                        border-bottom: none;
                    }
                    .label { 
                        font-weight: 600;
                        color: #667eea;
                        min-width: 100px;
                    }
                    .value {
                        color: #333;
                        flex: 1;
                    }
                    .message-box {
                        background: #f9f9f9;
                        border: 1px solid #e0e0e0;
                        border-radius: 4px;
                        padding: 20px;
                        margin: 20px 0;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    .message-label {
                        font-weight: 600;
                        color: #667eea;
                        margin-bottom: 10px;
                        display: block;
                    }
                    .footer { 
                        background-color: #f9f9f9;
                        text-align: center; 
                        color: #666; 
                        font-size: 12px; 
                        padding: 20px;
                        border-top: 1px solid #eee;
                    }
                    .footer-logo {
                        color: #667eea;
                        font-weight: 600;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            <span class="logo-icon">📧</span>
                            <span class="logo-text">Sky Apartments</span>
                        </div>
                        <h1>New Contact Message</h1>
                    </div>
                    
                    <div class="content">
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            You have received a new message from the contact form.
                        </p>
                        
                        <div class="info-box">
                            <div class="detail">
                                <span class="label">From:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Email:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="detail">
                                <span class="label">Subject:</span>
                                <span class="value">%s</span>
                            </div>
                        </div>
                        
                        <div class="message-box">
                            <span class="message-label">Message:</span>
                            %s
                        </div>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            💡 <strong>Tip:</strong> You can reply directly to this email to respond to %s
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>This message was sent via Sky Apartments contact form</p>
                        <div class="footer-logo">Sky Apartments</div>
                    </div>
                </div>
            </body>
            </html>
            """,
            name,
            email,
            subject,
            message.replace("\n", "<br>"),
            name
        );
    }
}