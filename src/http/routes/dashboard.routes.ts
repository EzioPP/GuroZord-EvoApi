import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Services } from '@/factory/services.factory';

export async function dashboardRoutes(app: FastifyInstance) {
  const { groupService, groupConfigRepository } = Services;

  /**
   * GET /dashboard/groups
   * Fetch all groups
   */
  app.get('/dashboard/groups', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const groups = await groupService.getAllGroupsWithConfigs();
      return reply.send({
        success: true,
        data: groups,
        total: groups.length,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch groups',
      });
    }
  });

  /**
   * GET /dashboard/groups/:groupId
   * Fetch a specific group
   */
  app.get('/dashboard/groups/:groupId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { groupId } = request.params as { groupId: string };
      const group = await groupService.getGroupById(Number(groupId));
      const configs = await groupConfigRepository.getAllConfigsForGroup(Number(groupId));
      
      return reply.send({
        success: true,
        data: {
          ...group,
          configs,
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch group',
      });
    }
  });

  /**
   * GET /dashboard/groups/:groupId/members
   * Fetch group members
   */
  app.get(
    '/dashboard/groups/:groupId/members',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { groupId } = request.params as { groupId: string };
        const group = await groupService.getGroupById(Number(groupId));
        const members = await groupService.getGroupParticipants(group.whatsappId);
        return reply.send({
          success: true,
          groupId: Number(groupId),
          members,
          total: members.length,
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch members',
        });
      }
    },
  );

  /**
   * POST /dashboard/groups/:groupId/open
   * Open a group
   */
  app.post(
    '/dashboard/groups/:groupId/open',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { groupId } = request.params as { groupId: string };
        const result = await groupService.openGroup(Number(groupId));
        return reply.send({
          success: true,
          message: 'Group opened',
          data: result,
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to open group',
        });
      }
    },
  );

  /**
   * POST /dashboard/groups/:groupId/close
   * Close a group
   */
  app.post(
    '/dashboard/groups/:groupId/close',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { groupId } = request.params as { groupId: string };
        const result = await groupService.closeGroup(Number(groupId));
        return reply.send({
          success: true,
          message: 'Group closed',
          data: result,
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to close group',
        });
      }
    },
  );

  /**
   * PUT /dashboard/groups/:groupId/times
   * Update group open/close times
   */
  app.put(
    '/dashboard/groups/:groupId/times',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { groupId } = request.params as { groupId: string };
        const { openTime, closeTime } = request.body as {
          openTime: string;
          closeTime: string;
        };

        const result = await groupService.changeOpenCloseTimes(
          Number(groupId),
          openTime,
          closeTime,
        );
        return reply.send({
          success: true,
          message: 'Times updated',
          data: result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update times',
        });
      }
    },
  );

  /**
   * GET /dashboard/health
   * API health check
   */
  app.get('/dashboard/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      status: 'gurozord running',
    });
  });
}

