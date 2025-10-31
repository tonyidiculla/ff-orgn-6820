import { NextRequest, NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/shared-services';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const token = req.cookies.get('furfield_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Decode token (don't verify since we trust auth service)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long-for-hs256') as any;
    
    console.log('🔍 Fetching organizations for user:', {
      userId: decoded.userId,
      userPlatformId: decoded.userPlatformId
    });

    if (!decoded.userPlatformId) {
      return NextResponse.json(
        { 
          success: true, 
          data: { 
            organizations: [],
            message: 'No user platform ID found'
          }
        }
      );
    }

    // Fetch organizations for user
    const organizations = await OrganizationService.getUserOrganizations(decoded.userPlatformId);

    return NextResponse.json({
      success: true,
      data: {
        organizations,
        total: organizations.length
      }
    });

  } catch (error: any) {
    console.error('🚨 Error in organizations API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}