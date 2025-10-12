import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-footer',
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  quickLinks = [
    { label: 'Hero', route: '/home', fragment: 'hero' },
    { label: 'Featured', route: '/home', fragment: 'featured' },
    { label: 'About', route: '/home', fragment: 'about' },
    { label: 'Contact', route: '/home', fragment: 'contact' }
  ];

  legalLinks = [
    { label: 'Privacy Policy', href: 'privacy.html' },
    { label: 'Terms & Conditions', href: 'terms.html' },
    { label: 'Cookie Policy', href: 'cookies.html' },
    { label: 'GDPR Compliance', href: 'gdpr.html' }
  ];

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}