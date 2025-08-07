import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { Liveblocks } from '@liveblocks/node';
import { ConvexHttpClient } from 'convex/browser';
import { NextRequest, NextResponse } from 'next/server';

import { api } from '@/../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const user = await currentUser();

    if (!sessionClaims || !user) {
      console.error('No session claims or user found');
      return new NextResponse('Unauthorized!', { status: 401 });
    }

    const { room } = await req.json();
    const document = await convex.query(api.documents.getById, { id: room });

    if (!document) {
      console.error('Document not found:', room);
      return new NextResponse('Unauthorized!', { status: 401 });
    }

    const isOwner = document.ownerId === user.id;

    // Try multiple ways to get the user's organization ID
    let userOrgId = sessionClaims.org_id || sessionClaims.organization_id;
    let userOrganizations: string[] = [];

    // If not found in session claims, try to get from Clerk API
    if (!userOrgId) {
      try {
        const clerk = await clerkClient();
        const organizationMemberships = await clerk.users.getOrganizationMembershipList({
          userId: user.id,
        });

        userOrganizations = organizationMemberships.data.map((membership: any) => membership.organization.id);

        if (userOrganizations.length > 0) {
          userOrgId = userOrganizations[0]; // Use the first organization as default
        }
      } catch (error) {
        console.error('Error fetching organization memberships:', error);
      }
    } else {
      // If we have userOrgId from session, add it to the organizations array
      userOrganizations = [userOrgId as string];
    }

    const isInDocumentOrg = document.organizationId && userOrganizations.includes(document.organizationId);
    const isOrganizationMember = !!(document.organizationId && isInDocumentOrg);

    const hasAccess = isOwner || isOrganizationMember;

    if (!hasAccess) {
      console.error('User not authorized for document:', {
        userId: user.id,
        documentId: room,
        isOwner,
        isOrganizationMember,
        documentOrgId: document.organizationId,
        userOrgId,
        userOrganizations,
      });

      // Return 404 instead of 401 for better UX
      return new NextResponse('Document not found', { status: 404 });
    }

    const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? 'Anonymous';
    const nameToNumber = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = Math.abs(nameToNumber) % 360;
    const color = `hsl(${hue}, 80%, 60%)`;

    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name,
        avatar: user.imageUrl,
        color,
      },
    });

    session.allow(room, session.FULL_ACCESS);

    const { body, status } = await session.authorize();

    return new NextResponse(body, { status });
  } catch (error) {
    console.error('Liveblocks auth error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
