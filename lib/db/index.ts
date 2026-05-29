export { db } from './client';
export {
  getDbUserIdByClerk,
  ensureDbUser,
  ensureDbUserForClerkId,
  getUserPlanByClerkId,
} from './scripts-user';
export {
  rowToSavedScript,
  savedScriptToCreatePayload,
  savedScriptToMetadata,
  parseAccountBalance,
  formatAccountBalance,
} from './script-mapper';
export { rowToSavedCollection } from './collection-mapper';
export {
  rowToAgentConversation,
  rowToAgentConversationSummary,
  rowToAgentMemory,
  type AgentConversationSummaryRow,
} from './agent-mapper';
export {
  listConversationsForUser,
  listRecentConversationsWithMessages,
  getConversationForUser,
  createConversation,
  updateConversationTitle,
  updateConversationScriptId,
  verifyScriptOwnership,
  deleteConversation,
  appendMessages,
  type CreateConversationResult,
} from './agent-conversations';
export {
  getAgentMemoryForUser,
  getMemoryLastUpdated,
  upsertAgentMemory,
  getScriptCountForUser,
} from './agent-memory';
export { listScriptsForUser } from './list-user-scripts';
export {
  searchScriptsForUser,
  type SearchScriptsFilters,
} from './search-user-scripts';
export {
  listCollectionsForUser,
  findUserCollectionByNameInsensitive,
} from './list-user-collections';
export {
  getScriptsByIds,
  createComparisonReport,
  listComparisonReportsForUser,
  getComparisonReportForUser,
  deleteComparisonReportForUser,
} from './comparison-reports';
export { getProgressStats } from './progress-stats';
