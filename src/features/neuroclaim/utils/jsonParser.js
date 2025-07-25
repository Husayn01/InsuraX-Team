// utils/jsonParser.js
export class JSONParser {
  static parseAIResponse(content) {
    let cleanContent = '';
    let attempts = [];
    
    try {
      // Attempt 1: Try parsing as-is
      try {
        return JSON.parse(content);
      } catch (e) {
        attempts.push({ method: 'direct', error: e.message });
      }

      cleanContent = content.trim();
      
      // Attempt 2: Remove markdown code blocks
      cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Extract JSON from mixed content (look for first { or [ to last } or ])
      const jsonStart = Math.min(
        cleanContent.indexOf('{') !== -1 ? cleanContent.indexOf('{') : Infinity,
        cleanContent.indexOf('[') !== -1 ? cleanContent.indexOf('[') : Infinity
      );
      
      if (jsonStart !== Infinity) {
        // Find the matching closing bracket
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        let jsonEnd = -1;
        
        for (let i = jsonStart; i < cleanContent.length; i++) {
          const char = cleanContent[i];
          
          if (!escapeNext) {
            if (char === '"' && !inString) {
              inString = true;
            } else if (char === '"' && inString) {
              inString = false;
            } else if (!inString) {
              if (char === '{' || char === '[') {
                depth++;
              } else if (char === '}' || char === ']') {
                depth--;
                if (depth === 0) {
                  jsonEnd = i;
                  break;
                }
              }
            }
            
            if (char === '\\' && inString) {
              escapeNext = true;
            }
          } else {
            escapeNext = false;
          }
        }
        
        if (jsonEnd !== -1) {
          cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
        }
      }
      
      // Attempt 3: Try parsing after extraction
      try {
        return JSON.parse(cleanContent);
      } catch (e) {
        attempts.push({ method: 'extracted', error: e.message });
      }
      
      // Attempt 4: Fix common JSON issues more carefully
      // Save original for comparison
      const beforeFixes = cleanContent;
      
      // Fix trailing commas - more precise regex
      cleanContent = cleanContent.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix single quotes only when they're clearly string delimiters
      // This is tricky - we'll be conservative
      cleanContent = cleanContent.replace(/'([^']*)'(\s*:)/g, '"$1"$2'); // Keys
      cleanContent = cleanContent.replace(/:\s*'([^']*)'/g, ': "$1"'); // Values
      
      // Fix unquoted keys - be more precise
      cleanContent = cleanContent.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // Replace problematic values
      cleanContent = cleanContent
        .replace(/:\s*undefined/g, ': null')
        .replace(/:\s*NaN/g, ': null')
        .replace(/:\s*Infinity/g, ': null')
        .replace(/:\s*-Infinity/g, ': null');
      
      try {
        return JSON.parse(cleanContent);
      } catch (e) {
        attempts.push({ method: 'basicFixes', error: e.message });
      }
      
      // Attempt 5: More aggressive fixes
      // Remove any non-JSON content after the last } or ]
      cleanContent = cleanContent.replace(/([}\]])[\s\S]*$/, '$1');
      
      // Fix double quotes issues
      cleanContent = cleanContent.replace(/\\"/g, '\\"'); // Ensure quotes are escaped
      cleanContent = cleanContent.replace(/([^\\])"/g, '$1\\"'); // Escape unescaped quotes inside strings
      
      // Then fix the structure quotes
      cleanContent = cleanContent.replace(/\\\\"/g, '\\"'); // Fix double escapes
      
      try {
        return JSON.parse(cleanContent);
      } catch (e) {
        attempts.push({ method: 'aggressiveFixes', error: e.message });
      }
      
      // Attempt 6: Try using eval as last resort (with safety checks)
      if (cleanContent.match(/^[\s]*[\{\[]/) && !cleanContent.match(/[()=;`]/)) {
        try {
          // Use Function constructor instead of eval for slightly better safety
          const result = new Function('return ' + cleanContent)();
          // Validate it's actually an object/array
          if (typeof result === 'object' && result !== null) {
            // Re-stringify and parse to ensure valid JSON
            return JSON.parse(JSON.stringify(result));
          }
        } catch (e) {
          attempts.push({ method: 'safeEval', error: e.message });
        }
      }
      
      // If all attempts failed, provide detailed error
      console.error('All JSON parsing attempts failed:');
      console.error('Original content:', content);
      console.error('After extraction:', beforeFixes);
      console.error('After fixes:', cleanContent);
      console.error('Attempts:', attempts);
      
      throw new Error(`Failed to parse AI response as JSON after ${attempts.length} attempts. Last error: ${attempts[attempts.length - 1]?.error || 'Unknown error'}`);
      
    } catch (error) {
      console.error('JSON parsing failed:', error);
      console.error('Content length:', content?.length || 0);
      console.error('First 200 chars:', content?.substring(0, 200));
      console.error('Last 200 chars:', content?.substring(content.length - 200));
      throw error;
    }
  }
}

export default JSONParser;