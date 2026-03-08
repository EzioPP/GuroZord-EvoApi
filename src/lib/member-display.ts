type MemberDisplayInput = {
  whatsappNumber: string;
  name?: string | null;
};

const normalizeMemberName = (name?: string | null): string | null => {
  const normalized = name?.trim();
  return normalized ? normalized : null;
};

export const resolveMemberDisplayValue = ({
  whatsappNumber,
  name,
}: MemberDisplayInput): string => {
  return normalizeMemberName(name) ?? whatsappNumber;
};

export const formatMemberMention = (member: MemberDisplayInput): string => {
  return `@${resolveMemberDisplayValue(member)}`;
};
