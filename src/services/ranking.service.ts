import { Logger } from "winston";
import { RankingRepository } from "@/persistence";

export class RankingService {
	constructor(
		private rankingRepository: RankingRepository,
		private logger: Logger,
	) {}

	async getRankings() {
		this.logger.info("Service: Fetching all rankings");
		return await this.rankingRepository.findAll();
	}

	async getMemberRanking(memberId: number) {
		this.logger.info("Service: Fetching ranking for member", { memberId });
		return await this.rankingRepository.findWithRank(memberId);
	}
}