import { NextRequest, NextResponse } from 'next/server';
import { EntityService } from '@/lib/shared-services';
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
    
    console.log('🔍 Fetching entities for user:', {
      userId: decoded.userId,
      userPlatformId: decoded.userPlatformId
    });

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const organizationPlatformId = searchParams.get('organizationPlatformId');

    let entities: any[] = [];

    if (organizationPlatformId) {
      // Fetch entities for specific organization
      entities = await EntityService.getOrganizationEntities(organizationPlatformId);
    } else if (decoded.userPlatformId) {
      // Fetch all entities for user's organizations
      entities = await EntityService.getUserEntities(decoded.userPlatformId);
    }

    return NextResponse.json({
      success: true,
      data: {
        entities,
        total: entities.length,
        organizationPlatformId
      }
    });

  } catch (error: any) {
    console.error('🚨 Error in entities API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}