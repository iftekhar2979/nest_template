export function parseRtLog(body: string): Record<string, string> {
    return body
      .trim()
      .split('\t')
      .reduce((result, item) => {
        const [key, value] = item.split('=');
        // Keep everything as strings: pin/index/cardno are identifiers, and
        // Number() would drop leading zeros (e.g. "083" → 83).
        result[key] = value;
        return result;
      }, {} as Record<string, string>);
  }