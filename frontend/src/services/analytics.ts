/**
 * Analytics Service
 *
 * Provides a unified interface for tracking user events and behavior.
 * Supports multiple analytics providers (Google Analytics, Mixpanel, Segment, etc.)
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
  signupDate?: Date;
  [key: string]: any;
}

class AnalyticsService {
  private isInitialized = false;
  private providers: Set<string> = new Set();

  /**
   * Initialize analytics providers
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    // Google Analytics 4
    if (this.loadGoogleAnalytics()) {
      this.providers.add('ga4');
    }

    // Segment
    if (this.loadSegment()) {
      this.providers.add('segment');
    }

    // Mixpanel
    if (this.loadMixpanel()) {
      this.providers.add('mixpanel');
    }

    this.isInitialized = true;
    console.log('Analytics initialized with providers:', Array.from(this.providers));
  }

  /**
   * Load Google Analytics 4
   */
  private loadGoogleAnalytics(): boolean {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!measurementId) {
      return false;
    }

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', measurementId);

    (window as any).gtag = gtag;
    return true;
  }

  /**
   * Load Segment Analytics
   */
  private loadSegment(): boolean {
    const writeKey = import.meta.env.VITE_SEGMENT_WRITE_KEY;
    if (!writeKey) {
      return false;
    }

    const analytics = ((window as any).analytics = (window as any).analytics || []);
    if (!analytics.initialize) {
      if (analytics.invoked) {
        console.error('Segment snippet included twice.');
        return false;
      }
      analytics.invoked = true;
      analytics.methods = [
        'trackSubmit',
        'trackClick',
        'trackLink',
        'trackForm',
        'pageview',
        'identify',
        'reset',
        'group',
        'track',
        'ready',
        'alias',
        'debug',
        'page',
        'once',
        'off',
        'on',
      ];
      analytics.factory = function (method: string) {
        return function (...args: any[]) {
          args.unshift(method);
          analytics.push(args);
          return analytics;
        };
      };
      for (let i = 0; i < analytics.methods.length; i++) {
        const key = analytics.methods[i];
        analytics[key] = analytics.factory(key);
      }
      analytics.load = function (key: string, options: any) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = `https://cdn.segment.com/analytics.js/v1/${key}/analytics.min.js`;
        const first = document.getElementsByTagName('script')[0];
        first.parentNode?.insertBefore(script, first);
        analytics._loadOptions = options;
      };
      analytics.load(writeKey, {});
      analytics.page();
    }
    return true;
  }

  /**
   * Load Mixpanel
   */
  private loadMixpanel(): boolean {
    const token = import.meta.env.VITE_MIXPANEL_TOKEN;
    if (!token) {
      return false;
    }

    // Simplified Mixpanel loading
    (window as any).mixpanel = (window as any).mixpanel || [];
    const mixpanel = (window as any).mixpanel;
    mixpanel.init = function () {
      console.log('Mixpanel initialized');
    };
    mixpanel.track = function (name: string, properties: any) {
      console.log('Mixpanel track:', name, properties);
    };
    mixpanel.identify = function (userId: string) {
      console.log('Mixpanel identify:', userId);
    };

    return true;
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, properties?: Record<string, any>) {
    if (!this.isInitialized) {
      this.initialize();
    }

    const pageData = {
      path,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      ...properties,
    };

    // Google Analytics
    if (this.providers.has('ga4') && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: path,
        page_title: document.title,
        ...properties,
      });
    }

    // Segment
    if (this.providers.has('segment') && (window as any).analytics) {
      (window as any).analytics.page(pageData);
    }

    console.log('Page view tracked:', pageData);
  }

  /**
   * Track an event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isInitialized) {
      this.initialize();
    }

    const eventData = {
      name: eventName,
      properties: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        path: window.location.pathname,
        ...properties,
      },
    };

    // Google Analytics
    if (this.providers.has('ga4') && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }

    // Segment
    if (this.providers.has('segment') && (window as any).analytics) {
      (window as any).analytics.track(eventName, properties);
    }

    // Mixpanel
    if (this.providers.has('mixpanel') && (window as any).mixpanel) {
      (window as any).mixpanel.track(eventName, properties);
    }

    console.log('Event tracked:', eventData);
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: UserProperties) {
    if (!this.isInitialized) {
      this.initialize();
    }

    // Google Analytics
    if (this.providers.has('ga4') && (window as any).gtag) {
      (window as any).gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
        user_id: userId,
      });
      if (properties) {
        (window as any).gtag('set', 'user_properties', properties);
      }
    }

    // Segment
    if (this.providers.has('segment') && (window as any).analytics) {
      (window as any).analytics.identify(userId, properties);
    }

    // Mixpanel
    if (this.providers.has('mixpanel') && (window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      if (properties) {
        (window as any).mixpanel.people.set(properties);
      }
    }

    console.log('User identified:', userId, properties);
  }

  /**
   * Track conversion funnel step
   */
  trackFunnel(step: string, properties?: Record<string, any>) {
    this.track(`funnel_${step}`, {
      funnel_step: step,
      ...properties,
    });
  }

  /**
   * Track A/B test variant view
   */
  trackExperiment(experimentName: string, variant: string, properties?: Record<string, any>) {
    this.track('experiment_viewed', {
      experiment_name: experimentName,
      variant,
      ...properties,
    });
  }

  /**
   * Reset analytics (e.g., on logout)
   */
  reset() {
    if (this.providers.has('segment') && (window as any).analytics) {
      (window as any).analytics.reset();
    }

    if (this.providers.has('mixpanel') && (window as any).mixpanel) {
      (window as any).mixpanel.reset();
    }

    console.log('Analytics reset');
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Convenience functions
export const trackPageView = (path: string, properties?: Record<string, any>) =>
  analytics.trackPageView(path, properties);

export const trackEvent = (eventName: string, properties?: Record<string, any>) =>
  analytics.track(eventName, properties);

export const identifyUser = (userId: string, properties?: UserProperties) =>
  analytics.identify(userId, properties);

export const trackFunnel = (step: string, properties?: Record<string, any>) =>
  analytics.trackFunnel(step, properties);

export const trackExperiment = (experimentName: string, variant: string, properties?: Record<string, any>) =>
  analytics.trackExperiment(experimentName, variant, properties);
