import { isValidRegionalOriginPair } from './is-valid-regional-origin-pair';

describe('isValidRegionalOriginPair', () => {
  describe('Production Connect domains', () => {
    test('should return true for same app from different regions', () => {
      const result = isValidRegionalOriginPair(
        'https://us-east-1.instance1.my.connect.aws',
        'https://us-west-2.instance1.my.connect.aws'
      );
      expect(result).toBe(true);
    });

    test('should return false for different apps from different regions', () => {
      const result = isValidRegionalOriginPair(
        'https://us-east-1.gamma.my.connect.aws',
        'https://us-west-2.instance1.my.connect.aws'
      );
      expect(result).toBe(false);
    });

    test('should return true for same app from various regions', () => {
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
      const baseOrigin = 'https://us-west-2.instance1.my.connect.aws';

      regions.forEach((region) => {
        const testOrigin = `https://${region}.instance1.my.connect.aws`;
        const result = isValidRegionalOriginPair(testOrigin, baseOrigin);
        expect(result).toBe(true);
      });
    });
  });

  describe('Non-production Connect domains', () => {
    describe('beta stage', () => {
      test('should return true for same app from different regions in beta', () => {
        const result = isValidRegionalOriginPair(
          'https://us-east-1.instance1.my.beta.global.nonprod.connect.aws.a2z.com',
          'https://us-west-2.instance1.my.beta.global.nonprod.connect.aws.a2z.com'
        );
        expect(result).toBe(true);
      });

      test('should return false for different apps in beta', () => {
        const result = isValidRegionalOriginPair(
          'https://us-east-1.gamma.my.beta.global.nonprod.connect.aws.a2z.com',
          'https://us-west-2.instance1.my.beta.global.nonprod.connect.aws.a2z.com'
        );
        expect(result).toBe(false);
      });

      test('should return false for mixed stages (beta vs gamma)', () => {
        const result = isValidRegionalOriginPair(
          'https://us-east-1.instance1.my.gamma.global.nonprod.connect.aws.a2z.com',
          'https://us-west-2.instance1.my.beta.global.nonprod.connect.aws.a2z.com'
        );
        expect(result).toBe(false);
      });
    });

    describe('gamma stage', () => {
      test('should return true for same app from different regions in gamma', () => {
        const result = isValidRegionalOriginPair(
          'https://eu-west-1.instance2.my.gamma.global.nonprod.connect.aws.a2z.com',
          'https://us-west-2.instance2.my.gamma.global.nonprod.connect.aws.a2z.com'
        );
        expect(result).toBe(true);
      });

      test('should return false for production vs gamma mix', () => {
        const result = isValidRegionalOriginPair(
          'https://us-east-1.instance1.my.gamma.global.nonprod.connect.aws.a2z.com',
          'https://us-west-2.instance1.my.connect.aws'
        );
        expect(result).toBe(false);
      });
    });
  });

  describe('Non-Connect domains', () => {
    test('should return false for random domains', () => {
      const nonConnectDomains = [
        'https://example.com',
        'https://malicious-site.com',
        'https://us-west-2.fake.domain.com',
        'https://test.my.connect.aws', // Missing region
        'http://us-west-2.instance1.my.connect.aws', // Wrong protocol
        'https://us-east-1.my-instance.awsapps.com', // CF domain format
        'https://my-instance.awsapps.com', // CF domain format without region
      ];

      nonConnectDomains.forEach((domain) => {
        const result = isValidRegionalOriginPair(domain, 'https://us-west-2.instance1.my.connect.aws');
        expect(result).toBe(false);
      });
    });

    test('should return false for URLs with invalid region format', () => {
      const invalidRegionUrls = [
        'https://us-eu-01.instance1.my.connect.aws', // Invalid region format
        'https://us-001.instance1.my.connect.aws', // Missing middle part in region
        'https://us-west.instance1.my.connect.aws', // Missing number in region
        'https://uswest2.instance1.my.connect.aws', // Missing hyphens in region
        'https://us-west-2a.instance1.my.connect.aws', // Invalid character in region number
      ];

      invalidRegionUrls.forEach((origin) => {
        const result = isValidRegionalOriginPair(origin, 'https://us-west-2.instance1.my.connect.aws');
        expect(result).toBe(false);
      });
    });

    test('should return false for URLs with similar but incorrect domain patterns', () => {
      const incorrectPatternUrls = [
        'https://us-west-2.instance.my.connect.com', // Wrong TLD
        'https://us-west-2.instance.connect.aws', // Missing 'my'
        'https://us-west-2.instance.my.aws', // Missing 'connect'
        'https://us-west-2.instance.my.connect.aws.com', // Extra .com
        'https://us-west-2.instance.nonprod.connect.aws', // Missing required parts for nonprod
      ];

      incorrectPatternUrls.forEach((origin) => {
        const result = isValidRegionalOriginPair(origin, 'https://us-west-2.instance1.my.connect.aws');
        expect(result).toBe(false);
      });
    });

    test('should return false for non-prod URLs with invalid stage or structure', () => {
      const invalidNonProdUrls = [
        'https://us-west-2.instance.my..global.nonprod.connect.aws.a2z.com', // Empty stage
        'https://us-west-2.instance.my.GAMMA.global.nonprod.connect.aws.a2z.com', // Uppercase stage
        'https://us-west-2.instance.my.gamma.nonprod.connect.aws.a2z.com', // Missing 'global'
        'https://us-west-2.instance.my.gamma.global.connect.aws.a2z.com', // Missing 'nonprod'
        'https://us-west-2.instance.my.gamma.global.nonprod.aws.a2z.com', // Missing 'connect'
      ];

      invalidNonProdUrls.forEach((origin) => {
        const result = isValidRegionalOriginPair(
          origin,
          'https://us-west-2.instance1.my.gamma.global.nonprod.connect.aws.a2z.com'
        );
        expect(result).toBe(false);
      });
    });
  });

  describe('Edge cases', () => {
    test('should return false for malformed origins', () => {
      const malformedOrigins = ['invalid-url', 'https://', 'https://us-west-2.', 'https://us-west-2.test', ''];

      malformedOrigins.forEach((origin) => {
        const result = isValidRegionalOriginPair(origin, 'https://us-west-2.instance1.my.connect.aws');
        expect(result).toBe(false);
      });
    });

    test('should return false for null and falsy values', () => {
      const falsyValues = [
        null as unknown as string,
        undefined as unknown as string,
        '',
        false as unknown as string,
        0 as unknown as string,
      ];

      falsyValues.forEach((origin) => {
        const result = isValidRegionalOriginPair(origin, 'https://us-west-2.instance1.my.connect.aws');
        expect(result).toBe(false);
      });
    });

    test.each([
      'https://us-eu-01.my.connect.aws', // Invalid: "eu" only 2 chars, "01" starts with 0
      'https://eu-us-1.my.connect.aws', // Invalid region format
      'https://us-west-0.instance1.my.connect.aws', // Invalid region number (0 not allowed)
      'https://us-central-1.my.connect.aws', // Invalid region name
      'https://global-1.instance1.my.connect.aws', // Invalid region format ("global" > 12 chars)
    ])('should return false for %s with invalid region format', (origin) => {
      const result = isValidRegionalOriginPair(origin, 'https://us-west-2.instance1.my.connect.aws');
      expect(result).toBe(false);
    });

    test('should return false for case sensitivity', () => {
      const result = isValidRegionalOriginPair(
        'https://US-WEST-2.instance1.MY.CONNECT.AWS',
        'https://us-west-2.instance1.my.connect.aws'
      );
      expect(result).toBe(false);
    });

    test('should return false when source is non-global-routing instance', () => {
      const result = isValidRegionalOriginPair(
        'https://us-west-2.instance1.my.connect.aws', // Valid global routing format
        'https://us-eu-01.my.connect.aws' // Non-global-routing
      );
      expect(result).toBe(false);
    });

    test('should return false when both are non-global-routing instances', () => {
      const result = isValidRegionalOriginPair(
        'https://eu-test-1.my.connect.aws', // Both non-global-routing
        'https://us-eu-01.my.connect.aws'
      );
      expect(result).toBe(false);
    });

    test('should return false when source is invalid nonprod instance', () => {
      const result = isValidRegionalOriginPair(
        'https://us-ap-1.my.gamma.global.nonprod.connect.aws.a2z.com', // Valid global routing format
        'https://us-eu-01.my.gamma.global.nonprod.connect.aws.a2z.com' // Non-global-routing
      );
      expect(result).toBe(false);
    });
  });

  describe('Symmetric validation', () => {
    test('should return same result regardless of parameter order', () => {
      const origin1 = 'https://us-east-1.instance1.my.connect.aws';
      const origin2 = 'https://us-west-2.instance1.my.connect.aws';

      const result1 = isValidRegionalOriginPair(origin1, origin2);
      const result2 = isValidRegionalOriginPair(origin2, origin1);

      expect(result1).toBe(result2);
      expect(result1).toBe(true);
    });

    test('should return false consistently for invalid pairs', () => {
      const validOrigin = 'https://us-west-2.instance1.my.connect.aws';
      const invalidOrigin = 'https://example.com';

      const result1 = isValidRegionalOriginPair(validOrigin, invalidOrigin);
      const result2 = isValidRegionalOriginPair(invalidOrigin, validOrigin);

      expect(result1).toBe(result2);
      expect(result1).toBe(false);
    });
  });
});
