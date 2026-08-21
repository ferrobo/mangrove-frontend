// Shared constants for MangroveSignal

export const ONBOARDING_KEY = 'mangrovesignal_onboarding_complete';
export const REVIEW_PASSWORD_KEY = 'mangrovesignal_review_password_session';

export const SPRING = [0.23, 1, 0.32, 1];

export const SOURCE_LANES = [
  {
    id: 'ground',
    number: '01',
    label: 'GROUND EVIDENCE',
    sublabel: 'Submitter-confirmed',
    description:
      'Submitter-confirmed observations and sanitized photo. The reporter decides which observations become their confirmed evidence.',
  },
  {
    id: 'mapped',
    number: '02',
    label: 'MAPPED CONTEXT',
    sublabel: 'Global Mangrove Watch — satellite-derived mapped extent',
    description:
      'Global Mangrove Watch provides satellite-derived mapped mangrove extent context. It does not verify what happened on the ground.',
  },
  {
    id: 'ai',
    number: '03',
    label: 'AI DRAFT',
    sublabel: 'Unconfirmed',
    description:
      'Gemini can draft visible observations from the photo. Its suggestions are unconfirmed and can be edited or removed.',
  },
  {
    id: 'human',
    number: '04',
    label: 'HUMAN DECISION',
    sublabel: 'Platform workflow state',
    description:
      'Submitted reports stay private first. A human reviewer controls when a report enters the public workflow.',
  },
];

export const TUTORIAL_STEPS = [
  {
    number: '01',
    label: 'GROUND EVIDENCE',
    title: 'Ground Evidence',
    body: 'Share a coastal photo and reported location. You decide which observations become your confirmed evidence.',
  },
  {
    number: '02',
    label: 'MAPPED CONTEXT',
    title: 'Mapped Context',
    body: 'Global Mangrove Watch provides satellite-derived mapped mangrove extent context. It does not verify what happened on the ground.',
  },
  {
    number: '03',
    label: 'AI DRAFT',
    title: 'AI Draft',
    body: 'Gemini can draft visible observations from the photo. Its suggestions are unconfirmed and can be edited or removed.',
  },
  {
    number: '04',
    label: 'HUMAN DECISION',
    title: 'Human Decision',
    body: 'Submitted reports stay private first. A human reviewer controls when a report enters the public workflow.',
  },
];

export const SIGNAL_FLOW = [
  { step: 'Report', desc: 'A community member shares a coastal photo and reported location.' },
  { step: 'AI + mapped context', desc: 'A vision draft and satellite-derived mapped extent are generated in parallel.' },
  { step: 'Reporter confirmation', desc: 'The reporter edits or removes AI suggestions and confirms their evidence.' },
  { step: 'Private submission', desc: 'The Review Packet is submitted — private, not yet public.' },
  { step: 'Human review', desc: 'A human reviewer decides whether the report enters the public workflow.' },
  { step: 'Public workflow', desc: 'If allowed through, the report appears as UNDER_REVIEW or FORWARDED on the public map.' },
];

export const VEGETATION_OPTIONS = [
  { value: 'intact_canopy', label: 'Intact canopy' },
  { value: 'partial_canopy', label: 'Partial canopy' },
  { value: 'sparse_vegetation', label: 'Sparse vegetation' },
  { value: 'no_vegetation', label: 'No vegetation' },
  { value: 'unclear', label: 'Unclear' },
];

export const WATER_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'unclear', label: 'Unclear' },
];

export const IMAGE_QUALITY_OPTIONS = [
  { value: 'adequate', label: 'Adequate' },
  { value: 'poor_lighting', label: 'Poor lighting' },
  { value: 'blurry', label: 'Blurry' },
  { value: 'too_distant', label: 'Too distant' },
  { value: 'obstructed', label: 'Obstructed' },
];

export const STATUS_LABELS = {
  UNDER_REVIEW: 'Under Review',
  FORWARDED: 'Forwarded',
  submitted: 'Submitted',
  dismissed: 'Dismissed',
  draft: 'Draft',
};

export const COVERAGE_LABELS = {
  in_extent: 'In mapped extent',
  not_in_extent: 'Not in mapped extent',
  outside_dataset: 'Outside dataset',
};
