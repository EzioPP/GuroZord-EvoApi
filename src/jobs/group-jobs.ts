import logger from "@/lib/logger";
import { groupJobsQueue } from "@/jobs/queue";

const toJobId = (action: "open" | "close", groupId: string): string => {
	return `${action}-${groupId}`;
};

const timeToCron = (timeStr: string): string => {
	const [hours, minutes] = timeStr.split(":");
	return `${minutes} ${hours} * * *`;
};

export const scheduleGroupJobs = async (
	groupId: number,
	openTime: string,
	closeTime: string
): Promise<void> => {
	const openJobId = toJobId("open", groupId.toString());
	const closeJobId = toJobId("close", groupId.toString());

	logger.info("group_jobs_scheduling", { groupId, openTime, closeTime });

	await groupJobsQueue.upsertJobScheduler(
		openJobId,
		{ pattern: timeToCron(openTime) },
		{ name: "open-group", data: { groupId } }
	);

	await groupJobsQueue.upsertJobScheduler(
		closeJobId,
		{ pattern: timeToCron(closeTime) },
		{ name: "close-group", data: { groupId } }
	);
};

export const cancelGroupJobs = async (groupId: number): Promise<void> => {
	await groupJobsQueue.removeJobScheduler(toJobId("open", groupId.toString()));
	await groupJobsQueue.removeJobScheduler(toJobId("close", groupId.toString()));
	logger.info("group_jobs_cancelled", { groupId });
};