
/**
 * Utility for robots.txt compliance checking
 */
export class RobotsChecker {
  constructor() {
    this.robotsCache = new Map();
    this.VERBOSE = process.env.VERBOSE === 'true';
  }

  /**
   * Checks if a URL is allowed according to robots.txt
   */
  async isAllowed(url, userAgent = '*') {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      // Check cache
      if (!this.robotsCache.has(robotsUrl)) {
        await this.fetchRobots(robotsUrl);
      }

      const rules = this.robotsCache.get(robotsUrl);
      if (!rules) {
        // If robots.txt could not be loaded, treat as allowed
        return true;
      }

      return this.checkRules(urlObj.pathname, rules, userAgent);

    } catch (error) {
      console.warn('Error checking robots.txt:', error.message);
      // On error, treat as allowed
      return true;
    }
  }

  /**
   * Loads and parses robots.txt
   */
  async fetchRobots(robotsUrl) {
    try {
      const response = await fetch(robotsUrl);
      if (!response.ok) {
        this.robotsCache.set(robotsUrl, null);
        return;
      }

      const text = await response.text();
      const rules = this.parseRobots(text);
      this.robotsCache.set(robotsUrl, rules);

    } catch (error) {
      console.warn(`Failed to load ${robotsUrl}:`, error.message);
      this.robotsCache.set(robotsUrl, null);
    }
  }

  /**
   * Parses robots.txt content
   */
  parseRobots(text) {
    const lines = text.split('\n').map(line => line.trim());
    const rules = new Map();
    let currentUserAgent = null;

    for (const line of lines) {
      if (line.startsWith('#') || line === '') {
        continue;
      }

      const [directive, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (directive.toLowerCase() === 'user-agent') {
        currentUserAgent = value.toLowerCase();
        if (!rules.has(currentUserAgent)) {
          rules.set(currentUserAgent, { allow: [], disallow: [] });
        }
      } else if (currentUserAgent && (directive.toLowerCase() === 'disallow' || directive.toLowerCase() === 'allow')) {
        const ruleType = directive.toLowerCase();
        rules.get(currentUserAgent)[ruleType].push(value);
      }
    }

    return rules;
  }

  /**
   * Checks rules for a given path
   */
  checkRules(path, rules, userAgent) {
    const specificRules = rules.get(userAgent.toLowerCase()) || rules.get('*');

    if (!specificRules) {
      return true;
    }

    // Check disallow rules
    for (const disallowPattern of specificRules.disallow) {
      if (disallowPattern === '') {
        continue; // Empty disallow = everything allowed
      }

      if (this.matchesPattern(path, disallowPattern)) {
        // Check if explicitly allowed
        for (const allowPattern of specificRules.allow) {
          if (this.matchesPattern(path, allowPattern)) {
            return true;
          }
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if path matches a pattern
   */
  matchesPattern(path, pattern) {
    if (pattern === '/') {
      return path === '/';
    }

    // Simple wildcard matching implementation
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\$/g, '$');

    const regex = new RegExp('^' + regexPattern);
    return regex.test(path);
  }

  /**
   * Logs robots.txt info for a given domain
   */
  async logRobotsInfo(url) {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      if (!this.robotsCache.has(robotsUrl)) {
        await this.fetchRobots(robotsUrl);
      }

      const rules = this.robotsCache.get(robotsUrl);
      if (!this.VERBOSE) {
        return;
      }
      console.log(`\nrobots.txt info for ${urlObj.host}:`);
      if (!rules) {
        console.log('   • robots.txt could not be loaded or does not exist');
        console.log('   • Crawler will continue (default: allowed)');
      } else {
        console.log('   • robots.txt loaded successfully');
        console.log(`   • Defined rules for ${rules.size} user-agent(s)`);

        for (const [userAgent, agentRules] of rules.entries()) {
          console.log(`   • ${userAgent}: ${agentRules.disallow.length} disallow, ${agentRules.allow.length} allow rules`);
        }
      }
      console.log('\n');

    } catch (error) {
      console.warn('Error getting robots.txt info:', error.message);
    }
  }
}