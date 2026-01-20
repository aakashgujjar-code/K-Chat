K Chat - Product Requirements Document (PRD)
1. Executive Summary
Product Name: K Chat
Product Vision: A modern, real-time messaging application combining the best features of Telegram and WhatsApp, built as a progressive web app with native Android support.
Tech Stack:

Frontend: React + Vite + TypeScript
Mobile: Capacitor (for Android native app)
Backend: Supabase (Authentication, Database, Realtime, Storage)
Deployment: Vercel (Frontend), Supabase(MCP already connected, Project name: K StudioChat)
Design System: Tailwind CSS


2. User Roles & Access
2.1 User Types

Regular User - End users who can chat, share status, customize their experience
Admin User - Single admin with management capabilities

2.2 Admin Access

URL: domainname.com/1234/admin
Authentication: One-time setup during first admin creation
Credentials: Fixed email and password (set during initial setup)


3. Design System
3.1 Color Palette

Primary: Sky Blue (#0EA5E9)
Secondary: White (#FFFFFF)
Accent: Black (#000000)
Additional: System-generated shades for UI consistency

3.2 Responsive Design

Mobile First: Bottom navigation bar
Desktop: Sidebar navigation
Breakpoint: 768px (Tailwind's md breakpoint)

3.3 Native Android Considerations

Status Bar: Visible (not fullscreen)
Navigation Bar: Android system buttons visible
Safe Area: Proper padding for notch/status bar


4. Frontend Application Structure
4.1 Authentication Flow
Sign Up Process (2-Step)
Step 1: Basic Information
Fields:
- Full Name (required, min 2 chars)
- Email (required, valid email format)
- Date of Birth (required, date picker)
- Gender (required, dropdown: Male/Female/Other/Prefer not to say)
- Password (required, min 8 chars, 1 uppercase, 1 number)
- Confirm Password (required, must match password)

Validation:
- Real-time validation on each field
- Show error messages below fields
- Enable "Next" button only when all fields valid
Step 2: Username Selection
Fields:
- Username (required, unique, 3-20 chars, alphanumeric + underscore)

Validation:
- Check username availability in real-time
- Show "Available" or "Taken" indicator
- No spaces allowed
- Must start with letter

Action:
- On successful creation → Redirect to Home page
Sign In Process
Fields:
- Email or Username
- Password

Features:
- Remember me checkbox
- Forgot password link
- Error handling for invalid credentials

4.2 Navigation Structure
Mobile Navigation (Bottom Bar)
Icons with labels:
1. Home (Chat icon)
2. Search (Magnifying glass)
3. Status (Circle/Story icon)
4. Settings (Gear icon)
Desktop Navigation (Sidebar)
Vertical sidebar with:
- App logo/name at top
- Same 4 navigation items
- User profile section at bottom
- Collapsible option

4.3 Feature Specifications
4.3.1 Home Screen
Layout:
┌─────────────────────────────┐
│ K Chat          [Profile]   │
├─────────────────────────────┤
│ 🔍 Search chats...          │
├─────────────────────────────┤
│ 👤 User 1      "Last msg"   │
│    2 hours ago         [2]  │
├─────────────────────────────┤
│ 👤 User 2      "Last msg"   │
│    5 hours ago              │
├─────────────────────────────┤
│ ...                         │
└─────────────────────────────┘
Features:

Search bar at top (filters chat list in real-time)
Chat list sorted by most recent message
Unread message count badge
Last message preview (truncated)
Timestamp (smart: "5m ago", "2h ago", "Yesterday", "MM/DD")
Online status indicator (green dot)
Typing indicator when other user is typing

Chat Interface:
Header:
- Back button
- User DP, Name, Username
- Online status
- Menu (block, report options)

Chat Area:
- Message bubbles (sent = right, received = left)
- Timestamp on each message
- Read receipts (checkmarks)
- Scroll to bottom button when scrolled up

Message Input:
- Text input field
- Emoji picker button
- Image upload button
- Send button (active when text/image present)
Message Types Supported:

Text Messages

Plain text
URLs (auto-clickable)
Max 5000 characters


Images

Formats: JPG, PNG, GIF, WebP
Max size: 5MB
Thumbnail in chat, click to view full


Emojis

Native emoji picker
Recent emojis saved



Future Message Types (Foundation):

Video messages
Voice messages
Files/Documents
Location sharing


4.3.2 Search Screen
Layout:
┌─────────────────────────────┐
│ 🔍 Search username...       │
├─────────────────────────────┤
│ [🎲 Random Chat]            │
├─────────────────────────────┤
│ Search Results:             │
│                             │
│ 👤 @username1               │
│    Full Name                │
│    [Chat]                   │
├─────────────────────────────┤
│ 👤 @username2               │
│    Full Name                │
│    [Chat]                   │
└─────────────────────────────┘
Features:

Username search (real-time)
User profile preview in results
Start chat with any user
Random Chat feature (prominent button)

Search Results Display:

User DP
Full Name
Username (@username)
"Chat" button
Respects privacy settings (public vs private profiles)


4.3.3 Random Chat Feature
Flow:
1. User clicks "Random Chat" button
2. New screen opens with loading state
3. System matches with random available user
4. Connection success message appears
5. Chat interface enables
Random Chat Screen:
┌─────────────────────────────┐
│ Random Chat    [Disconnect] │
├─────────────────────────────┤
│ 🎉 Connected successfully!  │
│    Now you can chat         │
├─────────────────────────────┤
│ Chatting with: @username    │
├─────────────────────────────┤
│ [Chat messages area]        │
│                             │
│                             │
├─────────────────────────────┤
│ 💬 Type a message...        │
└─────────────────────────────┘
Features:

Automatic random matching
Display both usernames
Text + Emoji support only (no images)
Disconnect button (always visible)
On disconnect → Option to start new random chat or exit
No chat history saved after disconnect

Matching Algorithm:

Pool of users who have Random Chat open
FIFO matching
If no users available → "Waiting for someone..." state
Timeout after 30 seconds → Show "No users available" message


4.3.4 Status Screen
Layout:
┌─────────────────────────────┐
│ Status              [+ Add] │
├─────────────────────────────┤
│ My Status:                  │
│ 👤 [Your status preview]    │
│    2 hours ago              │
├─────────────────────────────┤
│ Recent Updates:             │
│                             │
│ 👤 User 1 - 30m ago         │
│ 👤 User 2 - 1h ago          │
│ 👤 User 3 - 5h ago          │
└─────────────────────────────┘
Create Status:
┌─────────────────────────────┐
│ New Status       [Cancel]   │
├─────────────────────────────┤
│ 💬 What's on your mind?     │
│                             │
│ [Text area]                 │
│ [Emoji picker]              │
│                             │
├─────────────────────────────┤
│ Share with:                 │
│ ○ Chat List Only            │
│ ○ Everyone (Public)         │
├─────────────────────────────┤
│          [Post Status]      │
└─────────────────────────────┘
Features:

Content Types: Text + Emojis only
Duration: 24 hours auto-delete
Visibility Options:

Chat List Only (users you've chatted with)
Everyone (all app users)


Status Viewing:

Click to view full status
View count (how many people viewed)
List of viewers (visible to status creator)


Character Limit: 500 characters
My Status:

View your own status
Delete option
View count




4.3.5 Settings Screen
Main Settings Layout:
┌─────────────────────────────┐
│ Settings                    │
├─────────────────────────────┤
│ 👤 Profile                  │
│    Update your details      │
├─────────────────────────────┤
│ 🎨 Appearance               │
│    Themes & customization   │
├─────────────────────────────┤
│ 🔒 Privacy                  │
│    Control your privacy     │
├─────────────────────────────┤
│ 🚪 Logout                   │
└─────────────────────────────┘

A. Profile Settings
┌─────────────────────────────┐
│ Profile Settings   [Save]   │
├─────────────────────────────┤
│ Display Picture:            │
│ [Current DP]  [Change]      │
│                             │
├─────────────────────────────┤
│ Full Name:                  │
│ [John Doe]                  │
├─────────────────────────────┤
│ Username:                   │
│ [@johndoe]    [Change]      │
│ ⚠️ Can change after 5 days  │
│    (Next change: MM/DD)     │
└─────────────────────────────┘
Profile Fields:

Display Picture (DP)

Click to upload new image
Max size: 2MB
Formats: JPG, PNG
Crop to square before upload
Preview before saving


Full Name

Editable text field
Min 2 chars, max 50 chars
Instant update on save


Username

Shows current username
"Change" button
Restriction: Can only change once every 5 days
Shows countdown/next available date
Validation: unique, 3-20 chars, alphanumeric + underscore
Confirmation dialog before changing




B. Appearance Settings
┌─────────────────────────────┐
│ Appearance                  │
├─────────────────────────────┤
│ Theme Mode:                 │
│ ○ Light Mode                │
│ ○ Dark Mode                 │
│ ○ Auto (System)             │
├─────────────────────────────┤
│ Color Theme:                │
│ 🟦 Sky Blue (Default)       │
│ 🟩 Green                    │
│ 🟪 Purple                   │
│ 🟥 Red                      │
│ [Custom...]                 │
├─────────────────────────────┤
│ Chat Bubble Style:          │
│ ○ Rounded                   │
│ ○ Sharp                     │
├─────────────────────────────┤
│ Font Size:                  │
│ [Small] [Medium] [Large]    │
└─────────────────────────────┘
Customization Options:

Theme Mode

Light Mode
Dark Mode
Auto (follows system preference)


Color Theme

Default: Sky Blue, White, Black
Preset options: Green, Purple, Red, Orange, Pink
Custom color picker (advanced)
Applies to: Headers, buttons, accents


UI Customization

Chat bubble style (rounded/sharp)
Font size (small/medium/large)
Message density (compact/comfortable)


Background

Solid colors
Chat wallpaper upload option




C. Privacy Settings
┌─────────────────────────────┐
│ Privacy                     │
├─────────────────────────────┤
│ Profile Visibility:         │
│ ○ Public Profile            │
│ ○ Private Profile           │
│                             │
│ ℹ️ Public: Full profile     │
│    visible in search        │
│                             │
│ ℹ️ Private: Only DP, name,  │
│    username visible         │
├─────────────────────────────┤
│ Status Visibility:          │
│ ○ Everyone                  │
│ ○ Chat List Only            │
│ ○ Nobody                    │
├─────────────────────────────┤
│ Online Status:              │
│ ○ Show online status        │
│ ○ Hide online status        │
└─────────────────────────────┘
Privacy Options:

Profile Visibility

Public Profile:

Full profile visible in search
Shows: DP, Full Name, Username, Status
Anyone can start chat


Private Profile:

Limited info in search
Shows: DP, Name, Username only
No status visible
Chat requests require acceptance




Status Visibility

Everyone (all app users)
Chat List Only (users you've chatted with)
Nobody (only you can see)


Online Status

Show/Hide green dot indicator
Show/Hide "last seen" timestamp




5. Backend Architecture (Supabase)
5.1 Database Schema
Users Table
sqlusers (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email: text UNIQUE NOT NULL,
  full_name: text NOT NULL,
  username: text UNIQUE NOT NULL,
  date_of_birth: date NOT NULL,
  gender: text NOT NULL,
  profile_picture_url: text,
  profile_visibility: text DEFAULT 'public', -- 'public' | 'private'
  online_status_visible: boolean DEFAULT true,
  is_online: boolean DEFAULT false,
  last_seen: timestamp,
  username_last_changed: timestamp,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
Chats Table
sqlchats (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  user2_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now(),
  
  CONSTRAINT unique_chat_users UNIQUE (user1_id, user2_id)
)

-- Indexes
CREATE INDEX idx_chats_user1 ON chats(user1_id);
CREATE INDEX idx_chats_user2 ON chats(user2_id);
Messages Table
sqlmessages (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id: uuid REFERENCES chats(id) ON DELETE CASCADE,
  sender_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  receiver_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  message_type: text NOT NULL, -- 'text' | 'image' | 'emoji'
  content: text, -- text content or image URL
  is_read: boolean DEFAULT false,
  created_at: timestamp DEFAULT now()
)

-- Indexes
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
Random Chat Sessions Table
sqlrandom_chat_sessions (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  user2_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  status: text DEFAULT 'active', -- 'active' | 'disconnected'
  created_at: timestamp DEFAULT now(),
  ended_at: timestamp
)

-- Indexes
CREATE INDEX idx_random_chat_active ON random_chat_sessions(status) 
  WHERE status = 'active';
Random Chat Messages Table
sqlrandom_chat_messages (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id: uuid REFERENCES random_chat_sessions(id) ON DELETE CASCADE,
  sender_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  message_type: text NOT NULL, -- 'text' | 'emoji'
  content: text NOT NULL,
  created_at: timestamp DEFAULT now()
)

-- Indexes
CREATE INDEX idx_random_msgs_session ON random_chat_messages(session_id);
Statuses Table
sqlstatuses (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  content: text NOT NULL,
  visibility: text NOT NULL, -- 'chatlist' | 'everyone'
  view_count: integer DEFAULT 0,
  expires_at: timestamp NOT NULL, -- 24 hours from creation
  created_at: timestamp DEFAULT now()
)

-- Indexes
CREATE INDEX idx_statuses_user ON statuses(user_id);
CREATE INDEX idx_statuses_expires ON statuses(expires_at);
Status Views Table
sqlstatus_views (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_id: uuid REFERENCES statuses(id) ON DELETE CASCADE,
  viewer_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  viewed_at: timestamp DEFAULT now(),
  
  CONSTRAINT unique_status_view UNIQUE (status_id, viewer_id)
)

-- Indexes
CREATE INDEX idx_status_views_status ON status_views(status_id);
User Settings Table
sqluser_settings (
  user_id: uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme_mode: text DEFAULT 'light', -- 'light' | 'dark' | 'auto'
  color_theme: text DEFAULT 'skyblue',
  bubble_style: text DEFAULT 'rounded',
  font_size: text DEFAULT 'medium',
  status_visibility: text DEFAULT 'everyone', -- 'everyone' | 'chatlist' | 'nobody'
  updated_at: timestamp DEFAULT now()
)
Admin Table
sqladmins (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email: text UNIQUE NOT NULL,
  created_at: timestamp DEFAULT now()
)

-- Only one admin allowed
CREATE UNIQUE INDEX single_admin ON admins ((true));

5.2 Storage Buckets
Bucket: profile-pictures

Public read access
Authenticated upload
Max file size: 2MB
Allowed types: image/jpeg, image/png

Bucket: chat-images

Public read access
Authenticated upload
Max file size: 5MB
Allowed types: image/jpeg, image/png, image/gif, image/webp

Bucket: chat-backgrounds

Public read access
Authenticated upload
Max file size: 3MB
Allowed types: image/jpeg, image/png


5.3 Realtime Subscriptions
Channel: messages

Subscribe to new messages in active chat
Typing indicators
Read receipts

Channel: random_chat

Random chat matching
Random chat messages
Connection/disconnection events

Channel: user_status

Online/offline status updates
Last seen updates

Channel: statuses

New status posts
Status view updates


5.4 Row Level Security (RLS) Policies
Users Table:
sql-- Users can read all public profiles
CREATE POLICY "Public profiles viewable by all"
  ON users FOR SELECT
  USING (profile_visibility = 'public' OR auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
Messages Table:
sql-- Users can read messages they sent/received
CREATE POLICY "Users view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert messages they send
CREATE POLICY "Users insert own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
Statuses Table:
sql-- Users can view statuses based on visibility settings
CREATE POLICY "View statuses based on visibility"
  ON statuses FOR SELECT
  USING (
    visibility = 'everyone' 
    OR (visibility = 'chatlist' AND EXISTS (
      SELECT 1 FROM chats 
      WHERE (user1_id = auth.uid() AND user2_id = statuses.user_id)
         OR (user2_id = auth.uid() AND user1_id = statuses.user_id)
    ))
    OR user_id = auth.uid()
  );

-- Users can insert own statuses
CREATE POLICY "Users insert own status"
  ON statuses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 5.5 Edge Functions (Optional for Complex Logic)

**Function: `matchRandomChat`**
- Find available user for random chat
- Create session
- Return matched user info

**Function: `cleanupExpiredStatuses`**
- Scheduled function (cron job)
- Delete statuses older than 24 hours
- Run every hour

---

## 6. Admin Panel Specifications

### 6.1 Admin Access & Authentication

**URL:** `domainname.com/1234/admin`

**First-Time Setup:**
1. Check if admin exists in database
2. If no admin → Show registration form
3. If admin exists → Show login form

**Admin Creation Form:**
```
┌─────────────────────────────┐
│ Create Admin Account        │
├─────────────────────────────┤
│ Email:                      │
│ [email@example.com]         │
│                             │
│ Password:                   │
│ [••••••••]                  │
│                             │
│ Confirm Password:           │
│ [••••••••]                  │
│                             │
│ [Create Admin Account]      │
└─────────────────────────────┘
```

**Admin Login Form:**
```
┌─────────────────────────────┐
│ Admin Login                 │
├─────────────────────────────┤
│ Email:                      │
│ [email@example.com]         │
│                             │
│ Password:                   │
│ [••••••••]                  │
│                             │
│ [Login]                     │
└─────────────────────────────┘
```

---

### 6.2 Admin Dashboard Layout

**Basic UI (No fancy design required)**
```
┌─────────────────────────────────────────┐
│ K Chat Admin    Logged in as: admin@... │
├─────────────────────────────────────────┤
│ Sidebar      │ Main Content Area        │
│              │                          │
│ Dashboard    │ [Content based on        │
│ Analytics    │  selected menu]          │
│ Users        │                          │
│ Chats        │                          │
│ Statuses     │                          │
│ Random Chats │                          │
│              │                          │
│ Logout       │                          │
└─────────────────────────────────────────┘
```

---

### 6.3 Admin Features

#### **A. Dashboard (Overview)**
```
Key Metrics (Cards):
┌──────────────┬──────────────┬──────────────┐
│ Total Users  │ Active Today │ Total Chats  │
│    1,234     │     456      │    5,678     │
└──────────────┴──────────────┴──────────────┘

┌──────────────┬──────────────┬──────────────┐
│ Messages     │ Active       │ Total        │
│ Today        │ Statuses     │ Random Chats │
│    8,901     │     123      │    234       │
└──────────────┴──────────────┴──────────────┘
```

**Metrics:**
- Total registered users
- Active users (today, this week, this month)
- Total chats created
- Messages sent (today, this week, this month)
- Active statuses (not expired)
- Total random chat sessions
- New signups (today, this week)

---

#### **B. Analytics**

**User Growth Chart:**
- Line graph showing user signups over time
- Date range selector (last 7 days, 30 days, 3 months, all time)

**Activity Chart:**
- Messages sent per day
- Active users per day
- Dual-axis chart

**Status Analytics:**
- Total statuses posted
- Average views per status
- Most active status posters (top 10)

**Random Chat Analytics:**
- Total sessions
- Average session duration
- Most active random chat users

**Table Format (Simple):**
```
Date       | New Users | Messages | Active Users
-----------|-----------|----------|--------------
2026-01-19 |    45     |   1234   |    678
2026-01-18 |    38     |   1100   |    590
...
```

---

#### **C. User Management**

**User List Table:**
```
┌─────────────────────────────────────────────────────────────┐
│ Users                                    [Search: _______]  │
├────┬─────────┬──────────┬───────────┬──────────┬───────────┤
│ DP │ Name    │ Username │ Email     │ Status   │ Actions   │
├────┼─────────┼──────────┼───────────┼──────────┼───────────┤
│ 👤 │ John    │ @john123 │ j@mail.   │ 🟢 Online│ Edit Del  │
│ 👤 │ Sarah   │ @sarah   │ s@mail.   │ ⚪ Offline│ Edit Del  │
│ ...│         │          │           │          │           │
└────┴─────────┴──────────┴───────────┴──────────┴───────────┘
[< Previous]  Page 1 of 25  [Next >]
```

**Search/Filter:**
- Search by name, username, or email
- Filter by status (online/offline)
- Filter by join date

**User Actions:**
1. **View** - See full user details
2. **Edit** - Modify user information
3. **Delete** - Permanently delete user (with confirmation)

**Edit User Modal:**
```
┌─────────────────────────────┐
│ Edit User         [X Close] │
├─────────────────────────────┤
│ Full Name:                  │
│ [John Doe]                  │
│                             │
│ Email:                      │
│ [john@example.com]          │
│                             │
│ Username:                   │
│ [@johndoe]                  │
│                             │
│ Date of Birth:              │
│ [1990-01-15]                │
│                             │
│ Gender:                     │
│ [Male ▼]                    │
│                             │
│ Profile Visibility:         │
│ [Public ▼]                  │
│                             │
│ Account Status:             │
│ [Active ▼]                  │
│                             │
│ [Save Changes] [Cancel]     │
└─────────────────────────────┘
```

**Delete User:**
- Confirmation dialog: "Are you sure? This will delete all user data including chats and messages."
- Cascade delete (removes all related data)

**User Details View:**
- Registration date
- Last active
- Total messages sent
- Total chats
- Statuses posted
- Random chats participated

---

#### **D. Chat Management**

**Chat List Table:**
```
┌───────────────────────────────────────────────────────────┐
│ Chats                              [Search: __________]   │
├──────────────┬──────────────┬─────────────┬──────────────┤
│ User 1       │ User 2       │ Messages    │ Last Message │
├──────────────┼──────────────┼─────────────┼──────────────┤
│ @john123     │ @sarah       │     45      │  2 hours ago │
│ @mike        │ @lisa        │     12      │  5 hours ago │
│ ...          │              │             │              │
└──────────────┴──────────────┴─────────────┴──────────────┘
[< Previous]  Page 1 of 156  [Next >]
```

**Actions:**
- View chat history
- Delete chat (with confirmation)

**Chat History View:**
```
┌─────────────────────────────┐
│ Chat: @john123 ↔ @sarah     │
│                   [X Close] │
├─────────────────────────────┤
│                             │
│ @john123: Hello!            │
│ 10:30 AM                    │
│                             │
│         @sarah: Hi there!   │
│                    10:32 AM │
│                             │
│ @john123: How are you?      │
│ 10:35 AM                    │
│                             │
│ [Load More Messages]        │
└─────────────────────────────┘
```

---

#### **E. Status Management**

**Active Statuses Table:**
```
┌─────────────────────────────────────────────────────────────┐
│ Active Statuses                                             │
├──────────────┬─────────────────┬─────────┬─────────┬────────┤
│ User         │ Content         │ Views   │ Posted  │ Action │
├──────────────┼─────────────────┼─────────┼─────────┼────────┤
│ @john123     │ Feeling great...│   12    │ 2h ago  │ Delete │
│ @sarah       │ Happy Monday!.. │   25    │ 5h ago  │ Delete │
│ ...          │                 │         │         │        │
└──────────────┴─────────────────┴─────────┴─────────┴────────┘
Features:

View all active statuses (not expired)
Delete inappropriate statuses
View status viewers list

Status Details View:Continue7:38 PM┌─────────────────────────────┐
│ Status Details    [X Close] │
├─────────────────────────────┤
│ Posted by: @john123         │
│ Posted: 2 hours ago         │
│ Visibility: Everyone        │
│                             │
│ Content:                    │
│ "Feeling great today! 😊"   │
│                             │
│ Views: 12                   │
│                             │
│ Viewed by:                  │
│ - @sarah (1h ago)           │
│ - @mike (45m ago)           │
│ - @lisa (30m ago)           │
│ ...                         │
│                             │
│ [Delete Status]             │
└─────────────────────────────┘

F. Random Chat Management
Random Chat Sessions Table:
┌─────────────────────────────────────────────────────────────┐
│ Random Chat Sessions                                        │
├──────────────┬──────────────┬─────────┬──────────┬──────────┤
│ User 1       │ User 2       │ Status  │ Duration │ Started  │
├──────────────┼──────────────┼─────────┼──────────┼──────────┤
│ @john123     │ @stranger45  │ Active  │ 5m 23s   │ Just now │
│ @sarah       │ @mike        │ Ended   │ 15m 40s  │ 2h ago   │
│ ...          │              │         │          │          │
└──────────────┴──────────────┴─────────┴──────────┴──────────┘
Features:

View active random chat sessions
View ended sessions history
Force disconnect session (if needed)
View message count per session


6.4 Admin Database Schema
Admin Auth Table
sqladmin_users (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email: text UNIQUE NOT NULL,
  password_hash: text NOT NULL, -- bcrypt hash
  created_at: timestamp DEFAULT now()
)

-- Ensure only one admin
CREATE UNIQUE INDEX single_admin ON admin_users ((true));
Admin Activity Log
sqladmin_activity_log (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id: uuid REFERENCES admin_users(id),
  action: text NOT NULL, -- 'user_deleted', 'chat_deleted', etc.
  target_type: text, -- 'user', 'chat', 'status'
  target_id: uuid,
  details: jsonb,
  created_at: timestamp DEFAULT now()
)

-- Index
CREATE INDEX idx_admin_log_created ON admin_activity_log(created_at DESC);
```

---

## 7. Frontend Component Structure

### 7.1 Folder Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── SignUp.tsx
│   │   ├── SignIn.tsx
│   │   └── ProtectedRoute.tsx
│   ├── layout/
│   │   ├── Navigation.tsx
│   │   ├── MobileNav.tsx
│   │   └── Sidebar.tsx
│   ├── chat/
│   │   ├── ChatList.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   └── MessageInput.tsx
│   ├── search/
│   │   ├── UserSearch.tsx
│   │   ├── RandomChat.tsx
│   │   └── SearchResults.tsx
│   ├── status/
│   │   ├── StatusList.tsx
│   │   ├── CreateStatus.tsx
│   │   ├── StatusViewer.tsx
│   │   └── MyStatus.tsx
│   ├── settings/
│   │   ├── ProfileSettings.tsx
│   │   ├── AppearanceSettings.tsx
│   │   ├── PrivacySettings.tsx
│   │   └── ThemeCustomizer.tsx
│   └── common/
│       ├── Avatar.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── EmojiPicker.tsx
├── admin/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── Analytics.tsx
│   │   ├── UserManagement.tsx
│   │   ├── ChatManagement.tsx
│   │   ├── StatusManagement.tsx
│   │   └── RandomChatManagement.tsx
│   ├── AdminLogin.tsx
│   └── AdminLayout.tsx
├── pages/
│   ├── Home.tsx
│   ├── Search.tsx
│   ├── Status.tsx
│   └── Settings.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts
│   ├── useRealtime.ts
│   └── useTheme.ts
├── services/
│   ├── supabase.ts
│   ├── auth.service.ts
│   ├── chat.service.ts
│   ├── status.service.ts
│   └── admin.service.ts
├── utils/
│   ├── validators.ts
│   ├── formatters.ts
│   └── constants.ts
├── types/
│   ├── user.types.ts
│   ├── chat.types.ts
│   ├── status.types.ts
│   └── admin.types.ts
├── store/
│   ├── authStore.ts
│   ├── chatStore.ts
│   └── themeStore.ts
└── App.tsx

7.2 Key TypeScript Types
typescript// user.types.ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  profile_picture_url?: string;
  profile_visibility: 'public' | 'private';
  online_status_visible: boolean;
  is_online: boolean;
  last_seen?: string;
  username_last_changed?: string;
  created_at: string;
  updated_at: string;
}

// chat.types.ts
export interface Chat {
  id: string;
  user1_id: string;
  user2_id: string;
  user1?: User;
  user2?: User;
  last_message?: Message;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: 'text' | 'image' | 'emoji';
  content: string;
  is_read: boolean;
  created_at: string;
}

// status.types.ts
export interface Status {
  id: string;
  user_id: string;
  user?: User;
  content: string;
  visibility: 'chatlist' | 'everyone';
  view_count: number;
  expires_at: string;
  created_at: string;
}

export interface StatusView {
  id: string;
  status_id: string;
  viewer_id: string;
  viewer?: User;
  viewed_at: string;
}

8. API Endpoints (Supabase Functions)
8.1 Authentication APIs

POST /auth/signup - User registration
POST /auth/login - User login
POST /auth/logout - User logout
POST /auth/reset-password - Password reset

8.2 User APIs

GET /users/:id - Get user profile
PUT /users/:id - Update user profile
PUT /users/:id/username - Change username (with 5-day check)
POST /users/:id/profile-picture - Upload profile picture
GET /users/search?q=:query - Search users by username

8.3 Chat APIs

GET /chats - Get user's chat list
POST /chats - Create new chat
GET /chats/:id/messages - Get chat messages
POST /chats/:id/messages - Send message
PUT /messages/:id/read - Mark message as read

8.4 Random Chat APIs

POST /random-chat/match - Find random chat partner
GET /random-chat/session/:id/messages - Get session messages
POST /random-chat/session/:id/messages - Send message in session
POST /random-chat/session/:id/disconnect - End session

8.5 Status APIs

GET /statuses - Get visible statuses
POST /statuses - Create new status
DELETE /statuses/:id - Delete own status
POST /statuses/:id/view - Record status view
GET /statuses/:id/viewers - Get status viewers

8.6 Settings APIs

GET /settings/:user_id - Get user settings
PUT /settings/:user_id - Update user settings

8.7 Admin APIs

POST /admin/auth/create - Create admin (first-time only)
POST /admin/auth/login - Admin login
GET /admin/analytics - Get analytics data
GET /admin/users - Get all users
PUT /admin/users/:id - Update user
DELETE /admin/users/:id - Delete user
GET /admin/chats - Get all chats
DELETE /admin/chats/:id - Delete chat
GET /admin/statuses - Get all statuses
DELETE /admin/statuses/:id - Delete status
GET /admin/random-chats - Get random chat sessions


9. Realtime Features Implementation
9.1 Message Realtime
typescript// Subscribe to new messages in a chat
const subscription = supabase
  .channel(`chat:${chatId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chat_id=eq.${chatId}`
  }, (payload) => {
    // Add new message to UI
    addMessage(payload.new);
  })
  .subscribe();
9.2 Typing Indicator
typescript// Broadcast typing status
const channel = supabase.channel(`chat:${chatId}:typing`);

// Send typing event
channel.send({
  type: 'broadcast',
  event: 'typing',
  payload: { user_id: currentUserId }
});

// Listen for typing events
channel.on('broadcast', { event: 'typing' }, (payload) => {
  showTypingIndicator(payload.user_id);
});
9.3 Online Status
typescript// Update online status on mount
await supabase
  .from('users')
  .update({ is_online: true })
  .eq('id', userId);

// Listen for online status changes
const subscription = supabase
  .channel('user_status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'users'
  }, (payload) => {
    updateUserStatus(payload.new);
  })
  .subscribe();

// Update offline on unmount
window.addEventListener('beforeunload', () => {
  supabase
    .from('users')
    .update({ 
      is_online: false, 
      last_seen: new Date().toISOString() 
    })
    .eq('id', userId);
});
9.4 Random Chat Matching
typescript// Join random chat queue
const channel = supabase.channel('random_chat_queue');

// Broadcast availability
channel.send({
  type: 'broadcast',
  event: 'looking_for_match',
  payload: { user_id: currentUserId }
});

// Listen for match
channel.on('broadcast', { event: 'match_found' }, async (payload) => {
  if (payload.user_id === currentUserId) {
    // Create session
    const session = await createRandomChatSession(
      currentUserId, 
      payload.partner_id
    );
    openRandomChat(session);
  }
});

10. Security & Validation
10.1 Input Validation
Username Validation:

3-20 characters
Alphanumeric + underscore only
Must start with letter
Case insensitive uniqueness check

Email Validation:

Valid email format
Unique in database

Password Validation:

Minimum 8 characters
At least 1 uppercase letter
At least 1 number
At least 1 special character (optional but recommended)

Message Content:

Text: Max 5000 characters
Image: Max 5MB, JPEG/PNG/GIF/WebP
Emoji: Valid UTF-8 emoji

Status Content:

Max 500 characters
Text + emojis only


10.2 Rate Limiting
Message Sending:

Max 30 messages per minute per user
Implement using Supabase Edge Functions or client-side throttling

Status Creation:

Max 10 statuses per day per user

Username Change:

Once every 5 days

Random Chat:

Max 10 sessions per day per user


10.3 Content Moderation
Blocked Words/Patterns:

Maintain a list of inappropriate words
Filter in message content (optional, based on requirements)

Image Moderation:

Consider using third-party API (e.g., AWS Rekognition) for explicit content detection
Or manual admin review queue


10.4 Privacy Controls
Profile Visibility:

Public: Full profile visible
Private: Limited info (DP, name, username)

Status Visibility:

Everyone: All users can see
Chat list: Only users chatted with
Nobody: Only creator

Online Status:

Show/hide online indicator
Show/hide last seen


11. Mobile App (Capacitor) Specific Requirements
11.1 Capacitor Configuration
capacitor.config.ts:
typescriptimport { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kchat.app',
  appName: 'K Chat',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0EA5E9',
      overlaysWebView: false // IMPORTANT: Keeps status bar visible
    },
    NavigationBar: {
      backgroundColor: '#000000'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0EA5E9',
      showSpinner: false
    }
  }
};

export default config;
11.2 Android-Specific CSS
css/* Prevent fullscreen mode */
html, body {
  height: 100vh;
  height: -webkit-fill-available;
}

/* Safe area for status bar */
.app-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* Bottom navigation safe area */
.bottom-nav {
  padding-bottom: max(env(safe-area-inset-bottom), 16px);
}
11.3 Capacitor Plugins Required
Install:
bashnpm install @capacitor/status-bar
npm install @capacitor/navigation-bar
npm install @capacitor/splash-screen
npm install @capacitor/keyboard
npm install @capacitor/push-notifications (future)
npm install @capacitor/camera (for profile picture)
11.4 Build Process
Development Build:
bashnpm run build
npx cap sync android
npx cap open android
Production APK:
bashnpm run build
npx cap sync android
cd android
./gradlew assembleRelease

12. Deployment Strategy
12.1 Frontend Deployment (Vercel)
Step 1: Connect Repository

Push code to GitHub
Import project in Vercel
Auto-deploy on push to main branch

Step 2: Environment Variables
envVITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=K Chat
VITE_ADMIN_SECRET_PATH=1234
Step 3: Build Settings

Framework: Vite
Build Command: npm run build
Output Directory: dist
Node Version: 18.x

Step 4: Custom Domain (if needed)

Add custom domain in Vercel settings
Configure DNS records


12.2 Backend Deployment (Supabase)
Step 1: Create Supabase Project

Sign up at supabase.com
Create new project
Note down URL and anon key

Step 2: Database Setup

Run all SQL schema creation scripts
Set up RLS policies
Create indexes

Step 3: Storage Setup

Create buckets: profile-pictures, chat-images, chat-backgrounds
Set public access policies

Step 4: Edge Functions (if used)

Deploy Edge Functions for complex logic
Set environment variables

Step 5: Configure Realtime

Enable Realtime for required tables
Set up channels


12.3 Android App Distribution
Step 1: Generate Signed APK

Create keystore
Build release APK
Sign APK

Step 2: Testing

Install APK on test devices
Test all features
Verify status bar visibility

Step 3: Distribution

Upload to Google Play Console (for Play Store)
Or distribute APK directly


13. Testing Requirements
13.1 Unit Tests

Input validation functions
Date formatting utilities
Username uniqueness check

13.2 Integration Tests

Sign up flow
Chat message sending
Status creation
Random chat matching

13.3 E2E Tests (Optional)

Complete user journey (signup → chat → status)
Admin panel workflows

13.4 Mobile-Specific Tests

Status bar visibility on different Android versions
Keyboard behavior
Navigation gestures
Camera integration for profile picture


14. Performance Optimization
14.1 Frontend

Lazy load components
Virtual scrolling for long chat lists
Image optimization (compress before upload)
Code splitting per route
Memoize expensive computations

14.2 Backend

Database indexes on frequently queried columns
Pagination for large datasets
CDN for static assets
Connection pooling

14.3 Realtime

Unsubscribe from channels when not needed
Throttle typing indicator broadcasts
Batch status updates


15. Future Enhancements (Out of Scope for MVP)

Voice Messages
Video Calls
Group Chats
File Sharing
Location Sharing
Message Reactions
Message Editing/Deletion
Push Notifications (mobile)
Desktop App (Electron)
Multi-language Support
Chat Backup/Export
Two-Factor Authentication
Blue tick verification
Message forwarding
Polls in chats


16. Development Timeline Estimate
Phase 1: Setup & Authentication (Week 1)

Project setup (React + Vite + Capacitor + Supabase)
Sign up/Sign in flows
Database schema creation

Phase 2: Core Chat Features (Week 2-3)

Chat list UI
Chat window with messaging
Image upload
Emoji picker
Realtime messaging

Phase 3: Search & Random Chat (Week 4)

User search functionality
Random chat matching
Random chat interface

Phase 4: Status Feature (Week 5)

Status creation
Status viewing
Status visibility controls
24-hour expiry logic

Phase 5: Settings & Customization (Week 6)

Profile settings
Appearance customization
Privacy settings
Theme switcher

Phase 6: Admin Panel (Week 7)

Admin authentication
Dashboard & analytics
User management
Chat/Status management

Phase 7: Mobile App (Week 8)

Capacitor integration
Android-specific fixes (status bar)
Build & test APK

Phase 8: Testing & Deployment (Week 9)

Bug fixes
Performance optimization
Deploy to Vercel
Final testing

Total Estimated Time: 9-10 weeks (for a single developer)

17. Success Metrics
17.1 User Metrics

Daily Active Users (DAU)
Monthly Active Users (MAU)
User retention rate (Day 1, Day 7, Day 30)
Average session duration

17.2 Engagement Metrics

Messages sent per user per day
Statuses posted per user per day
Random chat sessions per day
Average chat response time

17.3 Technical Metrics

Page load time < 2 seconds
Message delivery time < 1 second
App crash rate < 1%
API response time < 500ms


18. Support & Maintenance
18.1 User Support

FAQ page
Contact form (in Settings)
Report user/content feature

18.2 Monitoring

Error tracking (Sentry)
Analytics (Google Analytics or Mixpanel)
Server monitoring (Supabase dashboard)

18.3 Regular Maintenance

Weekly database cleanup (expired statuses)
Monthly security audits
Quarterly feature reviews


19. Legal & Compliance
19.1 Privacy Policy

Data collection disclosure
Data storage information
Third-party services (Supabase, Vercel)
User rights (data deletion, export)

19.2 Terms of Service

Acceptable use policy
Content guidelines
Account termination conditions

19.3 GDPR Compliance (if applicable)

Data export option
Right to be forgotten (account deletion)
Cookie consent