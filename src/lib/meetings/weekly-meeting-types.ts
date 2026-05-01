import type { BusyMeetingParticipantType } from "@prisma/client";

export type CreateWeeklyMeetingInput = {
  groupName: string;
  meetingDateYmd: string;
  startTimeHhMm: string;
  endTimeHhMm?: string;
  location?: string;
  feeMnt?: number | null;
  enableMemberRegistration?: boolean;
  enableGuestRegistration?: boolean;
  enableSubstituteRegistration?: boolean;
  enableShortIntroduction?: boolean;
  enablePaymentTracking?: boolean;
};

export type PublicRegisterMeetingInput = {
  token: string;
  participantType: BusyMeetingParticipantType;
  displayName: string;
  companyName?: string;
  position?: string;
  phone?: string;
  email?: string;
  invitedBy?: string;
  businessCategory?: string;
  shortIntroduction?: string;
};
