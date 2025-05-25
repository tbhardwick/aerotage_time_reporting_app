/**
 * JWT Token Utilities
 * Safely decode and extract information from JWT tokens
 */

export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  name?: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
  aud?: string; // Audience
  iss?: string; // Issuer
  [key: string]: any;
}

/**
 * Safely decode a JWT token payload
 */
export const decodeJWTPayload = (token: string): JWTPayload | null => {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    const parsedPayload = JSON.parse(decodedPayload) as JWTPayload;
    
    return parsedPayload;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

/**
 * Extract user ID from JWT token
 */
export const extractUserIdFromToken = (token: string): string | null => {
  const payload = decodeJWTPayload(token);
  return payload?.sub || null;
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Get token expiration date
 */
export const getTokenExpiration = (token: string): Date | null => {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  return new Date(payload.exp * 1000);
}; 