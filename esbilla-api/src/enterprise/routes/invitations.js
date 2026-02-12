const express = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { sendInvitationEmail } = require('../services/email.js');

const router = express.Router();

/**
 * POST /api/invitations/send
 * Send an invitation email to a user
 *
 * Auth: Requires Firebase ID token
 * Body: { email, organizationId, type, role, locale }
 */
router.post('/send', async (req, res) => {
  try {
    // Get ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify token
    const auth = getAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('[Invitations] Invalid token:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const inviterUid = decodedToken.uid;

    // Get request data
    const { email, organizationId, type, role, locale = 'es' } = req.body;

    // Validate required fields
    if (!email || !organizationId || !type || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate type
    if (type !== 'organization' && type !== 'site') {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // Get Firestore
    const db = getFirestore();

    // Get inviter user document
    const inviterDoc = await db.collection('users').doc(inviterUid).get();
    if (!inviterDoc.exists) {
      return res.status(403).json({ error: 'Inviter not found' });
    }

    const inviterData = inviterDoc.data();

    // Check permissions
    const isSuperAdmin = inviterData.globalRole === 'superadmin';
    const orgAccess = inviterData.orgAccess || {};
    const hasOrgAccess = orgAccess[organizationId];

    if (!isSuperAdmin && !hasOrgAccess) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // If not superadmin, must be org_owner or org_admin
    if (!isSuperAdmin) {
      const orgRole = orgAccess[organizationId]?.role;
      if (orgRole !== 'org_owner' && orgRole !== 'org_admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    // Get organization data
    const orgDoc = await db.collection('organizations').doc(organizationId).get();
    if (!orgDoc.exists) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const orgData = orgDoc.data();

    // Check if user is already a member
    const existingUserQuery = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      const existingUser = existingUserQuery.docs[0].data();
      const existingOrgAccess = existingUser.orgAccess || {};

      if (existingOrgAccess[organizationId]) {
        return res.status(400).json({ error: 'User is already a member of this organization' });
      }
    }

    // Check for existing pending invitation
    const existingInviteQuery = await db.collection('invitations')
      .where('email', '==', email)
      .where('organizationId', '==', organizationId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingInviteQuery.empty) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Create invitation document
    const invitationRef = db.collection('invitations').doc();
    const invitationId = invitationRef.id;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invitationData = {
      id: invitationId,
      email,
      type,
      targetId: organizationId,
      targetName: orgData.name,
      role,
      organizationId,
      invitedBy: inviterUid,
      invitedByName: inviterData.displayName || inviterData.email,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAt,
      acceptedAt: null,
      acceptedBy: null,
    };

    await invitationRef.set(invitationData);

    // Send invitation email
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.esbilla.com';
    const inviteUrl = `${frontendUrl}/invite/${invitationId}`;

    try {
      await sendInvitationEmail(email, {
        inviterName: inviterData.displayName || inviterData.email,
        organizationName: orgData.name,
        role,
        inviteUrl,
        locale,
      });
    } catch (emailError) {
      console.error('[Invitations] Error sending email:', emailError);
      // Don't fail the request if email fails, invitation is created
    }

    res.json({
      success: true,
      invitationId,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('[Invitations] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/invitations/:id
 * Get invitation details
 *
 * Public endpoint (no auth required)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const db = getFirestore();
    const invitationDoc = await db.collection('invitations').doc(id).get();

    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitation = invitationDoc.data();

    // Check if expired
    const now = new Date();
    const expiresAt = invitation.expiresAt.toDate();

    if (now > expiresAt) {
      // Mark as expired
      await invitationDoc.ref.update({ status: 'expired' });
      return res.status(410).json({ error: 'Invitation expired' });
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return res.status(410).json({ error: 'Invitation already accepted' });
    }

    // Check if revoked
    if (invitation.status === 'revoked') {
      return res.status(410).json({ error: 'Invitation revoked' });
    }

    // Return public invitation data (don't expose internal IDs)
    res.json({
      email: invitation.email,
      organizationName: invitation.targetName,
      role: invitation.role,
      invitedByName: invitation.invitedByName,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('[Invitations] Error getting invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/invitations/:id/accept
 * Accept an invitation
 *
 * Auth: Requires Firebase ID token
 */
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    // Get ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify token
    const auth = getAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('[Invitations] Invalid token:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email;

    const db = getFirestore();
    const invitationRef = db.collection('invitations').doc(id);
    const invitationDoc = await invitationRef.get();

    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitation = invitationDoc.data();

    // Verify email matches
    if (invitation.email !== email) {
      return res.status(403).json({ error: 'Email mismatch' });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = invitation.expiresAt.toDate();

    if (now > expiresAt) {
      await invitationRef.update({ status: 'expired' });
      return res.status(410).json({ error: 'Invitation expired' });
    }

    // Check if already accepted
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation already processed' });
    }

    // Update user document with org access
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    const updateData = {
      [`orgAccess.${invitation.organizationId}`]: {
        organizationId: invitation.organizationId,
        organizationName: invitation.targetName,
        role: invitation.role,
        addedAt: FieldValue.serverTimestamp(),
        addedBy: invitation.invitedBy,
      },
    };

    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      await userRef.set({
        id: uid,
        email,
        displayName: decodedToken.name || email.split('@')[0],
        globalRole: 'pending',
        orgAccess: {
          [invitation.organizationId]: {
            organizationId: invitation.organizationId,
            organizationName: invitation.targetName,
            role: invitation.role,
            addedAt: FieldValue.serverTimestamp(),
            addedBy: invitation.invitedBy,
          },
        },
        onboardingCompleted: true,
        createdAt: FieldValue.serverTimestamp(),
        lastLogin: FieldValue.serverTimestamp(),
        authProvider: decodedToken.firebase.sign_in_provider,
      });
    } else {
      // Update existing user
      await userRef.update(updateData);
    }

    // Mark invitation as accepted
    await invitationRef.update({
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
      acceptedBy: uid,
    });

    res.json({ success: true });

  } catch (error) {
    console.error('[Invitations] Error accepting invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
