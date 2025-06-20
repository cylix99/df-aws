<!-- Copilot Instructions: Use the list of Shopify Polaris components below as a reference for available UI components. -->

# Shopify Polaris Components Reference

## Actions

### Account connection

Used for connecting or disconnecting a store to various accounts, like Facebook for the sales channel.

### Button

Used primarily for actions like 'Add', 'Close', 'Cancel', or 'Save'. Plain buttons are used for less important actions.

### Button group

Displays multiple related actions stacked or in a horizontal row for arrangement and spacing.

### Page actions

Allows merchants to take key actions at the bottom of specific pages in the interface.

## Layout and structure

### Bleed

Applies negative margin to a layout, extending it to the edge of the screen on small screens.

### Block stack

Use to display children vertically and horizontally with full width by default. Based on CSS Flexbox.

### Box

Box is the most primitive layout component. It’s a way to access Polaris design tokens.

### Callout card

Callout cards are used to encourage merchants to take an action related to a new feature or opportunity. They are most commonly displayed in the sales channels section of Shopify.

### Card

Used to group similar concepts and tasks together for easier scanning and reading.

### Divider

Use to separate or group content.

### Empty state

Empty states are used when a list, table, or chart has no items or data to show. This is an opportunity to provide explanation or guidance to help merchants progress. The empty state component is intended for use when a full page in the admin is empty, and not for individual elements or areas in the interface.

### Form layout

Manages the layout of all forms and fields within it. Used for the layout of new forms and managing the layout of all forms.

### Grid

Create complex layouts based on CSS Grid.

### Inline grid

Use to lay out children horizontally with equal gap between columns. Based on CSS Grid.

### Inline stack

Use to display children horizontally in a row. Based on CSS Flexbox.

### Layout

A structural component used to group other components. Creates consistent spacing and helps layout stack and scale responsively.

### Media card

Provides a container for introductory or highlight information. Often used in a grid to present related content.

### Page

Used to build the layout of a page in the Shopify admin. A flexible container for composing pages consistently.

## Selection and input

### Autocomplete

The autocomplete component is an input field that provides selectable suggestions as a merchant types into it. It allows merchants to quickly search through and select from large collections of options. It's a convenience wrapper around the Combobox and Listbox components with minor UI differences.

### Checkbox

Checkboxes are most commonly used to give merchants a way to make a range of selections (zero, one, or multiple). They may also be used as a way to have merchants indicate they agree to specific terms and services.

### Choice list

A choice list lets you create a list of grouped radio buttons or checkboxes. Use this component if you need to group together a related list of interactive choices.

### Color picker

Allows merchants to choose a color visually, or by entering a hex value.

### Combobox

Combobox is an accessible autocomplete input that enables merchants to filter a list of options and select one or more values.

### Date picker

Date pickers let merchants choose dates from a visual calendar that’s consistently applied wherever dates need to be selected across Shopify.

### Drop zone

The drop zone component lets users upload files by dragging and dropping the files into an area on a page, or activating a button.

### Filters

A composite component that filters the items of a list or table.

### Form

A wrapper component that handles the submission of forms.

### Index filters

Use index filters to allow merchants to filter, search, and sort their index table data and create unique saved views from the results.

### Inline error

Inline errors are brief, in-context messages that tell merchants something went wrong with a single or group of inputs in a form. Use inline errors to help merchants understand why a form input may not be valid and how to fix it.

### Radio button

Use radio buttons to present each item in a list of options where merchants must make a single selection.

### Range slider

A range slider is an input field that merchants can use to select a numeric value within a given range (minimum and maximum values).

### Select

Select lets merchants choose one option from an options menu. Consider select when you have 4 or more options, to avoid cluttering the interface.

### Tag

Tags represent a set of interactive, merchant-supplied keywords that help label, organize, and categorize objects. Tags can be added or removed from an object by merchants.

### Text field

A text field is an input field that merchants can type into. It has a range of options and supports several text formats including numbers.

## Images and icons

### Avatar

Used to show a thumbnail representation of an individual or business in the interface.

### Icon

Used to visually communicate core parts of the product and available actions, acting as wayfinding tools.

### Keyboard key

Used to educate merchants about keyboard shortcuts.

### Thumbnail

Used as a visual anchor and identifier for an object, along with text to provide context.

### Video thumbnail

A clickable placeholder image that opens a video player within a modal or full screen when clicked.

## Feedback indicators

### Badge

Used to inform merchants of the tone of an object or an action taken.

### Banner

Informs merchants about important changes or persistent conditions in a prominent way.

### Exception list

Helps merchants notice important, standout information that adds extra context to a task.

### Progress bar

Used to visually represent the completion of a task or operation.

### Skeleton body text

Provides a low fidelity representation of content before it appears, improving perceived load times.

### Skeleton display text

Provides a low fidelity representation of content before it appears, improving perceived load times.

### Skeleton page

Used with other skeleton loading components to provide a low fidelity representation of the UI before content appears.

### Skeleton tabs

Provides a low fidelity representation of content before it appears, improving perceived load times.

### Skeleton thumbnail

Provides a low fidelity representation of an image before it appears, improving perceived load times.

### Spinner

Used to notify merchants that their action is being processed. Used for content that can’t be represented with skeleton loading components.

## Typography

### Text

Typography helps establish hierarchy and communicate important content by creating clear visual patterns.

## Tables

### Data table

Used to organize and display all information from a data set. Aimed to be as simple as possible for merchants.

### Index table

An index table displays a collection of objects of the same type, like orders or products. The main job of an index table is to help merchants get an at-a-glance of the objects to perform actions or navigate to a full-page representation of it.

## Lists

### Action list

Action lists render a list of actions or selectable options. This component is usually placed inside a popover container to create a dropdown menu or to let merchants select from a list of options.

### Description list

Used to present pairs of related information, like terms and definitions, or names and values, in a list format.

### List

Lists display a set of related text-only content. Each list item begins with a bullet or a number.

### Listbox

A Listbox is a vertical list of interactive options, with room for icons, descriptions, and other elements.

### Option list

The option list component lets you create a list of grouped items that merchants can pick from. This can include single selection or multiple selection of options. Option list usually appears in a popover, and sometimes in a modal or a sidebar. Option lists are styled differently than choice lists and should not be used within a form, but as a standalone menu.

### Resource item

Resource items represent specific objects within a collection, such as products or orders. They provide contextual information on the resource type and link to the object’s detail page.

### Resource list

A resource list displays a collection of objects of the same type, like products or customers. The main job of a resource list is to help merchants find an object and navigate to a full-page representation of it.

## Navigation

### Footer help

Footer help is used to refer merchants to more information related to the product or feature they’re using.

### Fullscreen bar

The Fullscreen bar is a header component that should be presented at the top of an app when it is in fullscreen mode. This is designed to ensure a uniform placement for a button to exit that mode. The Fullscreen bar can be customized by adding children.

### Link

Links take users to another place, and usually appear within or directly following a sentence.

### Pagination

Use pagination to let merchants move through an ordered collection of items that has been split into pages. On the web, pagination uses buttons to move back and forth between pages. On iOS and Android, pagination uses infinite scrolling.

### Tabs

Used to alternate among related views within the same context.

## Overlays

### Popover

Small overlays that open on demand and close when the merchant interacts with any other part of Shopify. Used to surface secondary information or actions.

### Tooltip

Tooltips are floating labels that briefly explain the function of a user interface element. They can be triggered when merchants hover, focus, tap, or click.

## Utilities

### App provider

App provider is a required component that enables sharing global settings throughout the hierarchy of your application.

### Collapsible

Hides content and allows merchants to expand it. Used to hide optional settings, information, and actions.

### Scrollable

Used in components with too much content for the available vertical space. Embeds long-form content in components like modals and popovers.

## Deprecated

### Caption

Deprecated
Caption text is smaller than the recommended size for general reading. Used in graphs, timestamps, or as secondary text.

### Contextual save bar

Deprecated
Informs merchants of their options once they have made changes to a form on the page or while creating a new object.

### Display text

Deprecated
Display styles make a bold visual statement. Used for visual storytelling, marketing content, or capturing attention.

### Frame

Deprecated
Creates the structure of the Shopify admin. All of the main sections of the admin are nested in the frame.

### Heading

Deprecated
Used as the titles of each major section of a page in the interface, like in card components.

### Legacy card

Deprecated
Legacy version of the Card component. Used to group similar concepts and tasks together for easier scanning and reading.

### Legacy filters

Deprecated
Legacy version of the Filters component. Used to filter the items of a list or table.

### Legacy stack

Deprecated
Legacy version of the Stack component. Used for layout of a horizontal row of components or vertical centering.

### Legacy tabs

Deprecated
Used to alternate among related views within the same context.

### Loading

Deprecated
Used to indicate to merchants that a page is loading or an upload is processing.

### Modal

Deprecated
Used to interrupt merchants with urgent information, details, or actions.

### Navigation

Deprecated
The navigation component is used to display the primary navigation in the sidebar of the frame of an application. Navigation includes a list of links that merchants use to move between sections of the application.

### Setting toggle

Deprecated
Used to control a feature or option that can be turned on or off.

### Sheet

Deprecated
A large container providing actions and information contextual to the page without interrupting flow like a modal.

### Subheading

Deprecated
Used for the title of any sub-sections in top-level page sections.

### Text container

Deprecated
Used to wrap text elements like paragraphs, headings, and lists for vertical spacing.

### Text style

Deprecated
Enhances text with additional visual meaning, like using subdued text to de-emphasize it.

### Toast

Deprecated
A non-disruptive message that provides quick feedback on the outcome of an action.

### Top bar

Deprecated
Appears at the top of the page and is used to brand and navigate major applications areas.

### Visually hidden

Deprecated
Used when an element needs to be available to assistive technology but otherwise hidden.

# shopify/polaris-icons

AdjustIcon, AffiliateIcon, AirplaneIcon, AlertBubbleIcon, AlertCircleIcon, AlertDiamondIcon, AlertTriangleIcon, AppExtensionIcon, AppsFilledIcon, AppsIcon, ArchiveIcon, ArrowDiagonalIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, ArrowsInHorizontalIcon, ArrowsOutHorizontalFilledIcon, ArrowsOutHorizontalIcon, AtmWithdrawalIcon, AttachmentFilledIcon, AttachmentIcon, AutomationFilledIcon, AutomationIcon, BackspaceIcon, BankFilledIcon, BankIcon, BarcodeIcon, BillFilledIcon, BillIcon, BlankFilledIcon, BlankIcon, BlogIcon, BookIcon, BookOpenIcon, BugIcon, BulletIcon, ButtonIcon, ButtonPressIcon, CalculatorIcon, CalendarCheckIcon, CalendarIcon, CalendarTimeIcon, CameraFlipIcon, CameraIcon, CaretDownIcon, CaretUpIcon, CartAbandonedFilledIcon, CartAbandonedIcon, CartDiscountIcon, CartDownFilledIcon, CartDownIcon, CartFilledIcon, CartIcon, CartSaleIcon, CartUpIcon, CashDollarFilledIcon, CashDollarIcon, CashEuroIcon, CashPoundIcon, CashRupeeIcon, CashYenIcon, CatalogIcon, CategoriesIcon, ChannelsIcon, ChartCohortIcon, ChartDonutIcon, ChartFunnelIcon, ChartHistogramFirstIcon, ChartHistogramFirstLastIcon, ChartHistogramFlatIcon, ChartHistogramFullIcon, ChartHistogramGrowthIcon, ChartHistogramLastIcon, ChartHistogramSecondLastIcon, ChartHorizontalIcon, ChartLineIcon, ChartPopularIcon, ChartStackedIcon, ChartVerticalFilledIcon, ChartVerticalIcon, ChatIcon, ChatReferralIcon, CheckCircleIcon, CheckIcon, CheckSmallIcon, CheckboxIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, CircleChevronDownIcon, CircleChevronLeftIcon, CircleChevronRightIcon, CircleChevronUpIcon, CircleDownIcon, CircleLeftIcon, CircleRightIcon, CircleUpIcon, ClipboardCheckFilledIcon, ClipboardCheckIcon, ClipboardChecklistIcon, ClipboardIcon, ClockIcon, CodeAddIcon, CodeIcon, CollectionFeaturedIcon, CollectionFilledIcon, CollectionIcon, CollectionListIcon, CollectionReferenceIcon, ColorIcon, ColorNoneIcon, CompassIcon, ComposeIcon, ConfettiIcon, ConnectIcon, ContentFilledIcon, ContentIcon, ContractFilledIcon, ContractIcon, CornerPillIcon, CornerRoundIcon, CornerSquareIcon, CreditCardCancelIcon, CreditCardIcon, CreditCardPercentIcon, CreditCardReaderChipIcon, CreditCardReaderIcon, CreditCardReaderTapIcon, CreditCardSecureIcon, CreditCardTapChipIcon, CropIcon, CurrencyConvertIcon, CursorBannerIcon, CursorFilledIcon, CursorIcon, CursorOptionIcon, DataPresentationIcon, DataTableIcon, DatabaseAddIcon, DatabaseConnectIcon, DatabaseIcon, DeleteIcon, DeliveryFilledIcon, DeliveryIcon, DesktopIcon, DisabledIcon, DiscountCodeIcon, DiscountFilledIcon, DiscountIcon, DnsSettingsIcon, DockFloatingIcon, DockSideIcon, DomainFilledIcon, DomainIcon, DomainLandingPageIcon, DomainNewIcon, DomainRedirectIcon, DragDropIcon, DragHandleIcon, DuplicateIcon, EditIcon, EmailFollowUpIcon, EmailIcon, EmailNewsletterIcon, EnterIcon, EnvelopeIcon, EnvelopeSoftPackIcon, ExchangeIcon, ExitIcon, ExportIcon, ExternalIcon, ExternalSmallIcon, EyeCheckMarkIcon, EyeDropperIcon, EyeFirstIcon, EyeglassesIcon, FaviconIcon, FileFilledIcon, FileIcon, FilterIcon, FinanceFilledIcon, FinanceIcon, FlagIcon, FlipHorizontalIcon, FlipVerticalIcon, FlowerFilledIcon, FlowerIcon, FolderAddIcon, FolderDownIcon, FolderIcon, FolderRemoveIcon, FolderUpIcon, FoodIcon, ForkliftIcon, FormsIcon, GamesIcon, GaugeIcon, GiftCardFilledIcon, GiftCardIcon, GlobeAsiaFilledIcon, GlobeAsiaIcon, GlobeEUFilledIcon, GlobeEUIcon, GlobeFilledIcon, GlobeIcon, HashtagDecimalIcon, HashtagIcon, HeartIcon, HideIcon, HomeFilledIcon, HomeIcon, IconsFilledIcon, IconsIcon, IdentityCardFilledIcon, IdentityCardIcon, ImageAddIcon, ImageAltIcon, ImageExploreIcon, ImageIcon, ImageMagicIcon, ImageWithTextOverlayIcon, ImagesIcon, ImportIcon, InboundIcon, IncentiveIcon, IncomingIcon, InfoIcon, InventoryFilledIcon, InventoryIcon, InventoryUpdatedIcon, IqIcon, KeyIcon, KeyboardHideIcon, KeyboardIcon, LabelPrinterIcon, LanguageFilledIcon, LanguageIcon, LanguageTranslateIcon, LayoutBlockIcon, LayoutBuyButtonHorizontalIcon, LayoutBuyButtonIcon, LayoutBuyButtonVerticalIcon, LayoutColumn1Icon, LayoutColumns2Icon, LayoutColumns3Icon, LayoutFooterIcon, LayoutHeaderIcon, LayoutLogoBlockIcon, LayoutPopupIcon, LayoutRows2Icon, LayoutSectionIcon, LayoutSidebarLeftIcon, LayoutSidebarRightIcon, LightbulbIcon, LinkIcon, ListBulletedFilledIcon, ListBulletedIcon, ListNumberedIcon, LiveFilledIcon, LiveIcon, LocationFilledIcon, LocationIcon, LocationNoneIcon, LockFilledIcon, LockIcon, LogoCriteoIcon, LogoFacebookIcon, LogoGoogleIcon, LogoInstagramIcon, LogoMetaIcon, LogoPinterestIcon, LogoSnapchatIcon, LogoTiktokIcon, LogoTumblrIcon, LogoTwitchIcon, LogoVimeoIcon, LogoXIcon, LogoYoutubeIcon, MagicIcon, MakePaymentIcon, MarketsEuroFilledIcon, MarketsEuroIcon, MarketsFilledIcon, MarketsIcon, MarketsRupeeFilledIcon, MarketsRupeeIcon, MarketsYenFilledIcon, MarketsYenIcon, MaximizeIcon, MeasurementSizeIcon, MeasurementVolumeIcon, MeasurementWeightIcon, MediaReceiverIcon, MegaphoneFilledIcon, MegaphoneIcon, MentionIcon, MenuHorizontalIcon, MenuIcon, MenuVerticalIcon, MergeIcon, MetafieldsFilledIcon, MetafieldsIcon, MetaobjectFilledIcon, MetaobjectIcon, MetaobjectListIcon, MetaobjectReferenceIcon, MicrophoneIcon, MinimizeIcon, MinusCircleIcon, MinusIcon, MobileIcon, MoneyFilledIcon, MoneyIcon, MoneyNoneIcon, MoonIcon, NatureIcon, NoteAddIcon, NoteIcon, NotificationFilledIcon, NotificationIcon, OrderDraftFilledIcon, OrderDraftIcon, OrderFilledIcon, OrderFirstIcon, OrderFulfilledIcon, OrderIcon, OrderRepeatIcon, OrderUnfulfilledIcon, OrdersStatusIcon, OrganizationFilledIcon, OrganizationIcon, OutboundIcon, OutdentIcon, OutgoingIcon, PackageFilledIcon, PackageFulfilledIcon, PackageIcon, PackageOnHoldIcon, PackageReturnedIcon, PageAddIcon, PageAttachmentIcon, PageClockFilledIcon, PageClockIcon, PageDownIcon, PageHeartIcon, PageIcon, PageReferenceIcon, PageRemoveIcon, PageUpIcon, PaginationEndIcon, PaginationStartIcon, PaintBrushFlatIcon, PaintBrushRoundIcon, PaperCheckIcon, PasskeyFilledIcon, PasskeyIcon, PauseCircleIcon, PaymentCaptureIcon, PaymentFilledIcon, PaymentIcon, PayoutDollarIcon, PayoutEuroIcon, PayoutIcon, PayoutPoundIcon, PayoutRupeeIcon, PayoutYenIcon, PersonAddIcon, PersonExitIcon, PersonFilledIcon, PersonIcon, PersonLockFilledIcon, PersonLockIcon, PersonRemoveIcon, PersonSegmentIcon, PersonalizedTextIcon, PhoneIcon, PhoneInIcon, PhoneOutIcon, PinFilledIcon, PinIcon, PlanFilledIcon, PlanIcon, PlayCircleIcon, PlayIcon, PlusCircleIcon, PlusIcon, PointOfSaleIcon, PriceListFilledIcon, PriceListIcon, PrintIcon, ProductAddIcon, ProductCostIcon, ProductFilledIcon, ProductIcon, ProductListIcon, ProductReferenceIcon, ProductRemoveIcon, ProductReturnIcon, ProductUnavailableIcon, ProfileIcon, QuestionCircleIcon, ReceiptDollarFilledIcon, ReceiptDollarIcon, ReceiptEuroFilledIcon, ReceiptEuroIcon, ReceiptIcon, ReceiptPaidIcon, ReceiptPoundFilledIcon, ReceiptPoundIcon, ReceiptRefundIcon, ReceiptRupeeFilledIcon, ReceiptRupeeIcon, ReceiptYenFilledIcon, ReceiptYenIcon, RedoIcon, ReferralCodeIcon, RefreshIcon, RemoveBackgroundIcon, ReplaceIcon, ReplayIcon, ResetIcon, ReturnIcon, RewardIcon, RotateLeftIcon, RotateRightIcon, SandboxIcon, SaveIcon, SearchIcon, SearchListIcon, SearchRecentIcon, SearchResourceIcon, SelectIcon, SendIcon, SettingsFilledIcon, SettingsIcon, ShareIcon, ShieldCheckMarkIcon, ShieldNoneIcon, ShieldPendingIcon, ShieldPersonIcon, ShippingLabelFilledIcon, ShippingLabelIcon, ShopcodesIcon, SidekickIcon, SkeletonIcon, SlideshowIcon, SmileyHappyIcon, SmileyJoyIcon, SmileyNeutralIcon, SmileySadIcon, SocialAdIcon, SocialPostIcon, SortAscendingIcon, SortDescendingIcon, SortIcon, SoundIcon, SportsIcon, StarFilledIcon, StarIcon, StatusActiveIcon, StatusIcon, StopCircleIcon, StoreFilledIcon, StoreIcon, StoreImportIcon, StoreManagedIcon, StoreOnlineIcon, SunIcon, TabletIcon, TargetFilledIcon, TargetIcon, TaxFilledIcon, TaxIcon, TeamIcon, TextAlignCenterIcon, TextAlignLeftIcon, TextAlignRightIcon, TextBlockIcon, TextBoldIcon, TextColorIcon, TextFontIcon, TextFontListIcon, TextGrammarIcon, TextIcon, TextInColumnsIcon, TextInRowsFilledIcon, TextInRowsIcon, TextIndentIcon, TextItalicIcon, TextQuoteIcon, TextTitleIcon, TextUnderlineIcon, TextWithImageIcon, ThemeEditIcon, ThemeIcon, ThemeStoreIcon, ThemeTemplateIcon, ThumbsDownIcon, ThumbsUpIcon, TipJarIcon, ToggleOffIcon, ToggleOnIcon, TransactionFeeDollarIcon, TransactionFeeEuroIcon, TransactionFeePoundIcon, TransactionFeeRupeeIcon, TransactionFeeYenIcon, TransactionIcon, TransferIcon, TransferInIcon, TransferInternalIcon, TransferOutIcon, UndoIcon, UnknownDeviceIcon, UploadIcon, VariantIcon, ViewIcon, ViewportNarrowIcon, ViewportShortIcon, ViewportTallIcon, ViewportWideIcon, WalletFilledIcon, WalletIcon, WandIcon, WatchIcon, WifiIcon, WorkFilledIcon, WorkIcon, WrenchIcon, XCircleIcon, XIcon, XSmallIcon
