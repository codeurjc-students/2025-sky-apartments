import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ContactService, ContactResponse } from './contact.service';
import { ContactMessageDTO } from '../../dtos/contactMessage.dto';

describe('ContactService (Integration)', () => {
  let service: ContactService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ContactService,
        provideHttpClient(withInterceptorsFromDi())
      ]
    });
    
    service = TestBed.inject(ContactService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendContactMessage', () => {
    it('should send contact message successfully', (done) => {
      const contactMessage: ContactMessageDTO = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      };

      service.sendContactMessage(contactMessage).subscribe({
        next: (response: ContactResponse) => {
          expect(response).toBeTruthy();
          expect(response.status).toBeDefined();
          expect(response.message).toBeDefined();
          expect(typeof response.status).toBe('string');
          expect(typeof response.message).toBe('string');
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should send POST request with all required fields', (done) => {
      const contactMessage: ContactMessageDTO = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        subject: 'Product Inquiry',
        message: 'I would like more information about your products'
      };

      service.sendContactMessage(contactMessage).subscribe({
        next: (response: ContactResponse) => {
          expect(response).toBeTruthy();
          expect(response.status).toBeDefined();
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should handle validation errors for empty fields', (done) => {
      const invalidMessage: ContactMessageDTO = {
        name: '',
        email: '',
        subject: '',
        message: ''
      };

      service.sendContactMessage(invalidMessage).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.status).toBe(400);
          expect(err.error).toBeDefined();
          expect(err.error.message).toContain('Validation');
          done();
        }
      });
    });

    it('should handle validation errors for invalid email format', (done) => {
      const invalidMessage: ContactMessageDTO = {
        name: 'Test User',
        email: 'invalid-email-format',
        subject: 'Test',
        message: 'Test message'
      };

      service.sendContactMessage(invalidMessage).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.status).toBe(400);
          expect(err.error).toBeDefined();
          done();
        }
      });
    });

    it('should log errors to console when request fails', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const invalidMessage: ContactMessageDTO = {
        name: '',
        email: 'invalid',
        subject: '',
        message: ''
      };

      service.sendContactMessage(invalidMessage).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('ERROR in ContactService:', err);
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should send message with special characters', (done) => {
      const contactMessage: ContactMessageDTO = {
        name: 'José María',
        email: 'jose.maria@example.com',
        subject: 'Consulta sobre precios & servicios',
        message: 'Hola, ¿podrían enviarme información? Gracias!'
      };

      service.sendContactMessage(contactMessage).subscribe({
        next: (response: ContactResponse) => {
          expect(response).toBeTruthy();
          expect(response.status).toBeDefined();
          done();
        },
        error: (err) => {
          fail('Should handle special characters: ' + err.message);
          done();
        }
      });
    });

    it('should send long message content', (done) => {
      const longMessage = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
      const contactMessage: ContactMessageDTO = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Long Message Test',
        message: longMessage
      };

      service.sendContactMessage(contactMessage).subscribe({
        next: (response: ContactResponse) => {
          expect(response).toBeTruthy();
          expect(response.status).toBeDefined();
          done();
        },
        error: (err) => {
          fail('Should handle long messages: ' + err.message);
          done();
        }
      });
    });

    it('should handle multiple consecutive requests', (done) => {
      const message1: ContactMessageDTO = {
        name: 'User One',
        email: 'user1@example.com',
        subject: 'First Subject',
        message: 'This is the first message'
      };

      const message2: ContactMessageDTO = {
        name: 'User Two',
        email: 'user2@example.com',
        subject: 'Second Subject',
        message: 'This is the second message'
      };

      let completedRequests = 0;
      const totalRequests = 2;

      service.sendContactMessage(message1).subscribe({
        next: (response) => {
          expect(response).toBeTruthy();
          completedRequests++;
          if (completedRequests === totalRequests) {
            done();
          }
        },
        error: (err) => {
          fail('First request failed: ' + err.message);
          done();
        }
      });

      setTimeout(() => {
        service.sendContactMessage(message2).subscribe({
          next: (response) => {
            expect(response).toBeTruthy();
            completedRequests++;
            if (completedRequests === totalRequests) {
              done();
            }
          },
          error: (err) => {
            fail('Second request failed: ' + err.message);
            done();
          }
        });
      }, 100);
    });

    it('should handle missing required fields', (done) => {
      const incompleteMessage: ContactMessageDTO = {
        name: 'Test User',
        email: 'test@example.com',
        subject: '',
        message: ''
      };

      service.sendContactMessage(incompleteMessage).subscribe({
        next: () => {
          fail('Should have failed with validation error for missing fields');
          done();
        },
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should handle empty name field', (done) => {
      const invalidMessage: ContactMessageDTO = {
        name: '',
        email: 'valid@example.com',
        subject: 'Valid Subject',
        message: 'Valid message'
      };

      service.sendContactMessage(invalidMessage).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should handle empty message field', (done) => {
      const invalidMessage: ContactMessageDTO = {
        name: 'Valid Name',
        email: 'valid@example.com',
        subject: 'Valid Subject',
        message: ''
      };

      service.sendContactMessage(invalidMessage).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.status).toBe(400);
          done();
        }
      });
    });
  });
});