process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // Aumentar timeout para peticiones HTTP reales
        timeoutInterval: 10000
      },
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/your-project-name'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,
    
    proxies: {
      '/api/v1/apartments': 'http://localhost:8083/api/v1/apartments',
      '/api/v1/auth': 'http://localhost:8080/api/v1/auth/',
      '/api/v1/users': 'http://localhost:8080/api/v1/users',
      '/api/v1/bookings': 'http://localhost:8082/api/v1/bookings'
    },

    browserNoActivityTimeout: 60000,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    captureTimeout: 210000
  });
};