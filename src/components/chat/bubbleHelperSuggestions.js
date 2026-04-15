import SearchIcon from '@mui/icons-material/Search';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ExploreIcon from '@mui/icons-material/Explore';
import NearMeIcon from '@mui/icons-material/NearMe';
import BoltIcon from '@mui/icons-material/Bolt';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ViewListIcon from '@mui/icons-material/ViewList';
import WidgetsIcon from '@mui/icons-material/Widgets';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DescriptionIcon from '@mui/icons-material/Description';
import AddTaskIcon from '@mui/icons-material/AddTask';
import AppsIcon from '@mui/icons-material/Apps';
import PersonIcon from '@mui/icons-material/Person';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

const BUBBLE_HELPER_GROUPS = [
  {
    routePatterns: ['dashboard'],
    suggestions: [
      { text: "What's on this page?", icon: SearchIcon },
      { text: 'Do I have any pending tasks?', icon: TaskAltIcon },
      { text: 'Show me a summary of my current scope', icon: ExploreIcon },
      { text: 'Navigate to project management', icon: NearMeIcon },
      { text: 'What capabilities does the Command Center have?', icon: BoltIcon },
    ],
  },
  {
    routePatterns: ['project/management', 'project'],
    suggestions: [
      { text: 'List all the data available on this page', icon: ViewListIcon },
      { text: 'What actions can I take here?', icon: BoltIcon },
      { text: 'Help me find a specific project', icon: SearchIcon },
      { text: 'Show me the page outline', icon: DescriptionIcon },
      { text: 'What surfaces are available on this page?', icon: WidgetsIcon },
    ],
  },
  {
    routePatterns: ['workflow-orchestration', 'flow-design'],
    suggestions: [
      { text: 'Describe the workflows visible here', icon: AccountTreeIcon },
      { text: 'What capabilities are available?', icon: BoltIcon },
      { text: 'Show me the control plane overview', icon: ExploreIcon },
      { text: 'What actions can I perform on this page?', icon: WidgetsIcon },
      { text: 'Navigate to the operators list', icon: NearMeIcon },
    ],
  },
  {
    routePatterns: ['identity/organization', 'identity/users'],
    suggestions: [
      { text: 'What data is on this page?', icon: SearchIcon },
      { text: 'List the forms and fields I can interact with', icon: ViewListIcon },
      { text: 'Help me fill out this form', icon: EditNoteIcon },
      { text: 'Show me available surfaces', icon: WidgetsIcon },
      { text: 'What actions can I take here?', icon: BoltIcon },
    ],
  },
  {
    routePatterns: ['work-management', 'task'],
    suggestions: [
      { text: 'Show me my task inbox', icon: TaskAltIcon },
      { text: 'Do I have any tasks to claim?', icon: SearchIcon },
      { text: 'What are the details of my current task?', icon: DescriptionIcon },
      { text: 'Help me complete this task', icon: EditNoteIcon },
      { text: 'Create a new task', icon: AddTaskIcon },
    ],
  },
  {
    routePatterns: ['cognitive-infrastructure'],
    suggestions: [
      { text: 'What cognitive tools are configured?', icon: SmartToyIcon },
      { text: 'List the available agent profiles', icon: ViewListIcon },
      { text: 'What capabilities does the Command Center have?', icon: BoltIcon },
      { text: 'Show me the prompt templates', icon: DescriptionIcon },
      { text: 'Navigate to the LLM providers', icon: NearMeIcon },
    ],
  },
  {
    routePatterns: ['chat', 'conversation'],
    suggestions: [
      { text: 'What can the Command Center do?', icon: BoltIcon },
      { text: 'Show me my available capabilities', icon: ExploreIcon },
      { text: 'Navigate to the dashboard', icon: NearMeIcon },
      { text: 'Do I have any pending tasks?', icon: TaskAltIcon },
      { text: 'What is on this page?', icon: SearchIcon },
    ],
  },
  {
    routePatterns: ['account', 'profile'],
    suggestions: [
      { text: 'What information is on this page?', icon: PersonIcon },
      { text: 'Help me update my profile fields', icon: EditNoteIcon },
      { text: 'What forms can I interact with here?', icon: WidgetsIcon },
      { text: 'Navigate to the dashboard', icon: NearMeIcon },
      { text: 'Show me the page outline', icon: DescriptionIcon },
    ],
  },
  {
    routePatterns: ['app-engine'],
    suggestions: [
      { text: 'What apps are available here?', icon: AppsIcon },
      { text: 'Show me the page outline', icon: DescriptionIcon },
      { text: 'What actions can I take on this page?', icon: BoltIcon },
      { text: 'List the surfaces I can interact with', icon: WidgetsIcon },
      { text: 'Navigate to the dashboard', icon: NearMeIcon },
    ],
  },
];

const FALLBACK_SUGGESTIONS = [
  { text: "What's on this page?", icon: SearchIcon },
  { text: 'What can I do here?', icon: BoltIcon },
  { text: 'Show me my pending tasks', icon: TaskAltIcon },
  { text: 'What capabilities does the Command Center have?', icon: ExploreIcon },
  { text: 'Navigate to the dashboard', icon: NearMeIcon },
  { text: 'Describe the current scope', icon: DescriptionIcon },
];

export function selectBubbleHelpers(pathname, count = 4) {
  if (!pathname) {
    return FALLBACK_SUGGESTIONS.slice(0, count);
  }

  const lowerPath = pathname.toLowerCase();

  const matchingGroups = BUBBLE_HELPER_GROUPS.filter((group) =>
    group.routePatterns.some((pattern) => lowerPath.includes(pattern.toLowerCase())),
  );

  let pool =
    matchingGroups.length > 0 ? matchingGroups.flatMap((group) => group.suggestions) : [...FALLBACK_SUGGESTIONS];

  const seen = new Set();
  pool = pool.filter((item) => {
    if (seen.has(item.text)) {
      return false;
    }
    seen.add(item.text);
    return true;
  });

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}
