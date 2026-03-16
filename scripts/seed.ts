/**
 * Seed script — populates the database with sample therapist profiles + linked user accounts.
 * Run: npx tsx scripts/seed.ts
 *
 * Idempotent: upserts by slug so it's safe to run multiple times.
 *
 * Seeded therapist accounts can log in with:
 *   email:    <slug>@seed.therapio.co.il
 *   password: Therapist1!
 */

import 'dotenv/config';

if (process.env.NODE_ENV === 'production') {
  console.error('❌  seed must not run in production.');
  process.exit(1);
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { TherapistProfile } from '../src/lib/db/models/TherapistProfile';
import { Review } from '../src/lib/db/models/Review';
import { User } from '../src/lib/db/models/User';
import { Patient } from '../src/lib/db/models/Patient';
import { TreatmentSession } from '../src/lib/db/models/TreatmentSession';
import { Invoice } from '../src/lib/db/models/Invoice';
import { Appointment } from '../src/lib/db/models/Appointment';
import { Goal } from '../src/lib/db/models/Goal';
import { Counter } from '../src/lib/db/models/Counter';

const SEED_PASSWORD = 'Therapist1!';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/otsearch';

const profiles = [
  {
    slug: 'michal-cohen',
    displayName: { he: 'מיכל כהן', ar: 'ميخال كوهين', en: 'Michal Cohen' },
    bio: {
      he: 'מרפאה בעיסוק מוסמכת עם ניסיון של 10 שנים בטיפול בילדים עם קשיי עיבוד חושי ועיכובים התפתחותיים. מתמחה בגישה מבוססת משחק ובשיתוף פעולה הדוק עם הורים ומסגרות חינוכיות.',
      ar: 'معالجة وظيفية معتمدة بخبرة 10 سنوات في علاج الأطفال الذين يعانون من صعوبات المعالجة الحسية والتأخرات في النمو.',
      en: 'Certified occupational therapist with 10 years of experience treating children with sensory processing difficulties and developmental delays. Specialises in play-based approaches.',
    },
    photo: 'https://i.pravatar.cc/150?u=michal-cohen',
    mohRegistrationNumber: 'MOH-12345',
    specialisations: ['paediatrics', 'sensory-processing'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.7818, 32.0853], city: 'תל אביב', address: 'רחוב דיזנגוף 120, תל אביב' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['clalit', 'maccabi'],
    feeRange: { min: 400, max: 450, currency: 'ILS' as const },
    contactEmail: 'michal.cohen@therapio.co.il',
    contactPhone: '050-123-4567',
    subscriptionTier: 'premium' as const,
    isFeatured: true,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'yosef-levi',
    displayName: { he: 'יוסף לוי', ar: 'يوسف ليفي', en: 'Yosef Levi' },
    bio: {
      he: 'מרפא בעיסוק עם התמחות בשיקום נוירולוגי וטיפול בקשישים. עובד עם מטופלים לאחר שבץ מוחי, פרקינסון ופגיעות ראש.',
      ar: 'معالج وظيفي متخصص في إعادة التأهيل العصبي وعلاج كبار السن. يعمل مع مرضى ما بعد السكتة الدماغية.',
      en: 'OT specialising in neurological rehabilitation and elderly care. Works with post-stroke, Parkinson\'s and TBI patients.',
    },
    photo: 'https://i.pravatar.cc/150?u=yosef-levi',
    mohRegistrationNumber: 'MOH-23456',
    specialisations: ['neurological', 'geriatrics'],
    languages: ['he', 'ar', 'en'],
    location: { type: 'Point' as const, coordinates: [35.2137, 31.7683], city: 'ירושלים', address: 'רחוב יפו 80, ירושלים' },
    sessionTypes: ['in-person', 'home-visit'],
    insuranceAccepted: ['clalit', 'leumit', 'meuhedet'],
    feeRange: { min: 360, max: 400, currency: 'ILS' as const },
    contactEmail: 'yosef.levi@therapio.co.il',
    contactPhone: '052-234-5678',
    subscriptionTier: 'premium' as const,
    isFeatured: true,
    isAcceptingPatients: true,
    gender: 'male' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'sara-mizrahi',
    displayName: { he: 'שרה מזרחי', ar: 'سارة مزراحي', en: 'Sara Mizrahi' },
    bio: {
      he: 'מרפאה בעיסוק המתמחה בבריאות הנפש ובטיפול בילדים עם הפרעות קשב וריכוז וחרדה. עובדת בגישה קוגניטיבית-התנהגותית.',
      ar: 'معالجة وظيفية متخصصة في الصحة النفسية وعلاج الأطفال الذين يعانون من اضطراب نقص الانتباه.',
      en: 'OT specialising in mental health and children with ADHD and anxiety disorders. Uses cognitive-behavioural approaches.',
    },
    photo: 'https://i.pravatar.cc/150?u=sara-mizrahi',
    mohRegistrationNumber: 'MOH-34567',
    specialisations: ['mental-health', 'paediatrics'],
    languages: ['he', 'ru'],
    location: { type: 'Point' as const, coordinates: [34.9896, 32.7940], city: 'חיפה', address: 'שדרות הנשיא 50, חיפה' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['maccabi', 'meuhedet'],
    feeRange: { min: 380, max: 420, currency: 'ILS' as const },
    contactEmail: 'sara.mizrahi@therapio.co.il',
    contactPhone: '054-345-6789',
    subscriptionTier: 'premium' as const,
    isFeatured: false,
    isAcceptingPatients: false,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'david-peretz',
    displayName: { he: 'דוד פרץ', ar: 'ديفيد بيرتس', en: 'David Peretz' },
    bio: {
      he: 'מרפא בעיסוק מומחה לטיפול ביד ושיקום נוירולוגי. בעל ניסיון נרחב בטיפול בפציעות ספורט ותאונות עבודה.',
      ar: 'معالج وظيفي خبير في علاج اليد وإعادة التأهيل العصبي مع خبرة واسعة في إصابات الرياضة.',
      en: 'OT expert in hand therapy and neurological rehabilitation with extensive experience in sports injuries and work accidents.',
    },
    photo: 'https://i.pravatar.cc/150?u=david-peretz',
    mohRegistrationNumber: 'MOH-45678',
    specialisations: ['hand-therapy', 'neurological'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.7913, 31.2520], city: 'באר שבע', address: 'שדרות רגר 110, באר שבע' },
    sessionTypes: ['in-person'],
    insuranceAccepted: ['clalit', 'maccabi', 'leumit'],
    feeRange: { min: 350, max: 380, currency: 'ILS' as const },
    contactEmail: 'david.peretz@therapio.co.il',
    contactPhone: '058-456-7890',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'male' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'hana-shapira',
    displayName: { he: 'חנה שפירא', ar: 'حنا شابيرا', en: 'Hana Shapira' },
    bio: {
      he: 'מרפאה בעיסוק עם התמחות בגריאטריה ושיקום לאחר ניתוח. מסייעת לקשישים לשמור על עצמאות ואיכות חיים.',
      ar: 'معالجة وظيفية متخصصة في رعاية كبار السن وإعادة التأهيل بعد الجراحة.',
      en: 'OT specialising in geriatrics and post-surgical rehabilitation, helping elderly patients maintain independence and quality of life.',
    },
    photo: 'https://i.pravatar.cc/150?u=hana-shapira',
    mohRegistrationNumber: 'MOH-56789',
    specialisations: ['geriatrics', 'neurological'],
    languages: ['he', 'en', 'ru'],
    location: { type: 'Point' as const, coordinates: [34.8516, 32.3215], city: 'נתניה', address: 'רחוב הרצל 55, נתניה' },
    sessionTypes: ['in-person', 'home-visit', 'telehealth'],
    insuranceAccepted: ['clalit', 'maccabi', 'meuhedet', 'leumit'],
    feeRange: { min: 350, max: 400, currency: 'ILS' as const },
    contactEmail: 'hana.shapira@therapio.co.il',
    contactPhone: '050-567-8901',
    subscriptionTier: 'premium' as const,
    isFeatured: true,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'amir-hassan',
    displayName: { he: 'עמיר חסן', ar: 'عامر حسن', en: 'Amir Hassan' },
    bio: {
      he: 'מרפא בעיסוק דובר ערבית ועברית, מתמחה בטיפול בילדים ובני נוער עם לקויות התפתחותיות. מעניק שירות בצפון הארץ.',
      ar: 'معالج وظيفي يتحدث العربية والعبرية، متخصص في علاج الأطفال والمراهقين الذين يعانون من إعاقات في النمو.',
      en: 'Arabic and Hebrew-speaking OT specialising in children and adolescents with developmental disabilities. Serves northern Israel.',
    },
    photo: 'https://i.pravatar.cc/150?u=amir-hassan',
    mohRegistrationNumber: 'MOH-67890',
    specialisations: ['paediatrics', 'sensory-processing', 'mental-health'],
    languages: ['ar', 'he', 'en'],
    location: { type: 'Point' as const, coordinates: [35.1041, 32.9181], city: 'נצרת', address: 'רחוב פאולוס השישי 12, נצרת' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['clalit', 'maccabi', 'meuhedet', 'leumit'],
    feeRange: { min: 330, max: 370, currency: 'ILS' as const },
    contactEmail: 'amir.hassan@therapio.co.il',
    contactPhone: '052-678-9012',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'male' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'rivka-goldman',
    displayName: { he: 'רבקה גולדמן', ar: 'ريفكا غولدمان', en: 'Rivka Goldman' },
    bio: {
      he: 'מרפאה בעיסוק בתחום הארגונומיה ושיקום תעסוקתי. מסייעת לעובדים עם פציעות עבודה ומחלות מקצוע לחזור לתפקוד מלא.',
      ar: 'معالجة وظيفية في مجال الإرغونوميا وإعادة التأهيل المهني. تساعد العمال المصابين على استعادة وظائفهم الكاملة.',
      en: 'OT specialising in ergonomics and vocational rehabilitation, helping injured workers return to full function and employment.',
    },
    photo: 'https://i.pravatar.cc/150?u=rivka-goldman',
    mohRegistrationNumber: 'MOH-78901',
    specialisations: ['ergonomic', 'vocational'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.7818, 32.0853], city: 'תל אביב', address: 'רחוב שלמה המלך 8, תל אביב' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['maccabi'],
    feeRange: { min: 450, max: 550, currency: 'ILS' as const },
    contactEmail: 'rivka.goldman@therapio.co.il',
    contactPhone: '054-789-0123',
    subscriptionTier: 'premium' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'noa-katz',
    displayName: { he: 'נועה כץ', ar: 'نوعا كاتس', en: 'Noa Katz' },
    bio: {
      he: 'מרפאה בעיסוק מתמחה בריפוי ביד ופציעות יד. בעלת תעודת הכשרה בינלאומית ב-CHT. מטפלת גם בפציעות ספורט.',
      ar: 'معالجة وظيفية متخصصة في علاج اليد وإصابات اليد. حاصلة على شهادة دولية في العلاج اليدوي.',
      en: 'OT specialising in hand therapy and hand injuries with international CHT certification. Also treats sports-related injuries.',
    },
    photo: 'https://i.pravatar.cc/150?u=noa-katz',
    mohRegistrationNumber: 'MOH-89012',
    specialisations: ['hand-therapy'],
    languages: ['he', 'en', 'fr'],
    location: { type: 'Point' as const, coordinates: [34.9896, 32.7940], city: 'חיפה', address: 'רחוב ממשי 25, חיפה' },
    sessionTypes: ['in-person'],
    insuranceAccepted: ['clalit', 'maccabi', 'meuhedet', 'leumit'],
    feeRange: { min: 420, max: 480, currency: 'ILS' as const },
    contactEmail: 'noa.katz@therapio.co.il',
    contactPhone: '050-890-1234',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'eli-ben-david',
    displayName: { he: 'אלי בן דוד', ar: 'إيلي بن ديفيد', en: 'Eli Ben David' },
    bio: {
      he: 'מרפא בעיסוק בעל ניסיון של 15 שנה בשיקום ילדים עם שיתוק מוחי וצרכים מיוחדים. עובד בשיתוף פעולה עם גנים ובתי ספר.',
      ar: 'معالج وظيفي بخبرة 15 عامًا في إعادة تأهيل الأطفال المصابين بالشلل الدماغي.',
      en: 'OT with 15 years of experience in rehabilitation of children with cerebral palsy and special needs, collaborating with schools.',
    },
    photo: 'https://i.pravatar.cc/150?u=eli-ben-david',
    mohRegistrationNumber: 'MOH-90123',
    specialisations: ['paediatrics', 'neurological', 'sensory-processing'],
    languages: ['he'],
    location: { type: 'Point' as const, coordinates: [34.8983, 32.1663], city: 'רמת גן', address: 'שדרות ירושלים 30, רמת גן' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['clalit', 'meuhedet'],
    feeRange: { min: 380, max: 420, currency: 'ILS' as const },
    contactEmail: 'eli.bendavid@therapio.co.il',
    contactPhone: '052-901-2345',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'male' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'fatima-abu-ali',
    displayName: { he: 'פאטמה אבו עלי', ar: 'فاطمة أبو علي', en: 'Fatima Abu Ali' },
    bio: {
      he: 'מרפאה בעיסוק ערבייה המתמחה בטיפול בנשים ובילדים. מעניקה שירות בעברית ובערבית במגזר הערבי ובמעורב.',
      ar: 'معالجة وظيفية متخصصة في علاج النساء والأطفال. تقدم الخدمة باللغة العربية والعبرية في المجتمعات العربية والمختلطة.',
      en: 'Arabic OT specialising in women\'s and children\'s care. Provides services in both Arabic and Hebrew across mixed communities.',
    },
    photo: 'https://i.pravatar.cc/150?u=fatima-abu-ali',
    mohRegistrationNumber: 'MOH-01234',
    specialisations: ['paediatrics', 'mental-health'],
    languages: ['ar', 'he'],
    location: { type: 'Point' as const, coordinates: [35.2137, 31.7683], city: 'ירושלים', address: 'שכונת בית צפאפא, ירושלים' },
    sessionTypes: ['in-person', 'home-visit'],
    insuranceAccepted: ['clalit', 'maccabi', 'meuhedet', 'leumit'],
    feeRange: { min: 320, max: 360, currency: 'ILS' as const },
    contactEmail: 'fatima.abuali@therapio.co.il',
    contactPhone: '054-012-3456',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'tamar-roi',
    displayName: { he: 'תמר רועי', ar: 'تامار روعي', en: 'Tamar Roi' },
    bio: {
      he: 'מרפאה בעיסוק מתמחה בריפוי בעיסוק פסיכיאטרי ותמיכה בבריאות הנפש. עובדת עם מבוגרים הסובלים מדיכאון, חרדה ומשבר.',
      ar: 'معالجة وظيفية متخصصة في علاج اضطرابات نفسية تعمل مع البالغين الذين يعانون من الاكتئاب والقلق.',
      en: 'OT specialising in psychiatric occupational therapy and mental health support, working with adults facing depression and anxiety.',
    },
    photo: 'https://i.pravatar.cc/150?u=tamar-roi',
    mohRegistrationNumber: 'MOH-11234',
    specialisations: ['mental-health'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.7818, 32.0853], city: 'תל אביב', address: 'רחוב בן יהודה 45, תל אביב' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['maccabi', 'meuhedet'],
    feeRange: { min: 400, max: 450, currency: 'ILS' as const },
    contactEmail: 'tamar.roi@therapio.co.il',
    contactPhone: '050-112-2334',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: false,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'ron-ofer',
    displayName: { he: 'רון עופר', ar: 'رون عوفر', en: 'Ron Ofer' },
    bio: {
      he: 'מרפא בעיסוק בתחום הארגונומיה התעסוקתית. מסייע לארגונים להתאים את סביבת העבודה ולמנוע פציעות חוזרות.',
      ar: 'معالج وظيفي في مجال الإرغونوميا المهنية. يساعد المؤسسات على تكييف بيئة العمل ومنع الإصابات المتكررة.',
      en: 'OT in occupational ergonomics, helping organisations adapt work environments and prevent repetitive strain injuries.',
    },
    photo: 'https://i.pravatar.cc/150?u=ron-ofer',
    mohRegistrationNumber: 'MOH-22345',
    specialisations: ['ergonomic', 'vocational'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.7818, 32.0853], city: 'תל אביב', address: 'דרך מנחם בגין 23, תל אביב' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: [],
    feeRange: { min: 500, max: 600, currency: 'ILS' as const },
    contactEmail: 'ron.ofer@therapio.co.il',
    contactPhone: '052-223-3445',
    subscriptionTier: 'premium' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'male' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'orna-friedman',
    displayName: { he: 'אורנה פרידמן', ar: 'أورنا فريدمان', en: 'Orna Friedman' },
    bio: {
      he: 'מרפאה בעיסוק בכירה עם 20 שנות ניסיון בשיקום נוירולוגי לאחר שבץ ופגיעות ראש. מדריכה ומנחה קלינית.',
      ar: 'معالجة وظيفية أولى بخبرة 20 عامًا في إعادة التأهيل العصبي بعد السكتة الدماغية وإصابات الرأس.',
      en: 'Senior OT with 20 years in neurological rehabilitation post-stroke and TBI. Clinical trainer and supervisor.',
    },
    photo: 'https://i.pravatar.cc/150?u=orna-friedman',
    mohRegistrationNumber: 'MOH-33456',
    specialisations: ['neurological', 'geriatrics'],
    languages: ['he', 'en', 'ru'],
    location: { type: 'Point' as const, coordinates: [34.8516, 32.3215], city: 'נתניה', address: 'רחוב הרצל 20, נתניה' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['clalit', 'maccabi', 'meuhedet', 'leumit'],
    feeRange: { min: 450, max: 520, currency: 'ILS' as const },
    contactEmail: 'orna.friedman@therapio.co.il',
    contactPhone: '054-334-4556',
    subscriptionTier: 'premium' as const,
    isFeatured: true,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'gal-bar-oz',
    displayName: { he: 'גל בר-אוז', ar: 'غال بار-أوز', en: 'Gal Bar-Oz' },
    bio: {
      he: 'מרפאה בעיסוק המתמחה בטיפול בגיל הרך — ילדים עד גיל 6. עובדת עם עיכובים בדיבור, מוטוריקה ואינטגרציה חושית.',
      ar: 'معالجة وظيفية متخصصة في رعاية الأطفال الصغار حتى سن 6 سنوات.',
      en: 'OT specialising in early childhood — children up to age 6 — covering speech delays, motor skills, and sensory integration.',
    },
    photo: 'https://i.pravatar.cc/150?u=gal-bar-oz',
    mohRegistrationNumber: 'MOH-44567',
    specialisations: ['paediatrics', 'sensory-processing'],
    languages: ['he'],
    location: { type: 'Point' as const, coordinates: [34.9024, 32.0819], city: 'פתח תקווה', address: 'שדרות זבוטינסקי 100, פתח תקווה' },
    sessionTypes: ['in-person', 'home-visit'],
    insuranceAccepted: ['clalit', 'maccabi', 'meuhedet'],
    feeRange: { min: 360, max: 400, currency: 'ILS' as const },
    contactEmail: 'gal.baroz@therapio.co.il',
    contactPhone: '050-445-5667',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'moshe-dvir',
    displayName: { he: 'משה דביר', ar: 'موشيه دفير', en: 'Moshe Dvir' },
    bio: {
      he: 'מרפא בעיסוק מומחה לשיקום תעסוקתי ושוק העבודה. מסייע לאנשים עם מוגבלויות להשתלב בשוק העבודה.',
      ar: 'معالج وظيفي خبير في إعادة التأهيل المهني وسوق العمل. يساعد الأشخاص ذوي الإعاقات على الاندماج في سوق العمل.',
      en: 'OT expert in vocational rehabilitation and labour market integration, helping people with disabilities re-enter work.',
    },
    photo: 'https://i.pravatar.cc/150?u=moshe-dvir',
    mohRegistrationNumber: 'MOH-55678',
    specialisations: ['vocational', 'mental-health'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.7913, 31.2520], city: 'באר שבע', address: 'רחוב קק"ל 40, באר שבע' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['clalit', 'meuhedet'],
    feeRange: { min: 350, max: 400, currency: 'ILS' as const },
    contactEmail: 'moshe.dvir@therapio.co.il',
    contactPhone: '052-556-6778',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'male' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'shira-landau',
    displayName: { he: 'שירה לנדאו', ar: 'شيرا لانداو', en: 'Shira Landau' },
    bio: {
      he: 'מרפאה בעיסוק בתחום בריאות הנפש ופסיכיאטריה. מתמחה בהפרעות אכילה, PTSD ושיקום לאחר אשפוז פסיכיאטרי.',
      ar: 'معالجة وظيفية في مجال الصحة النفسية متخصصة في اضطرابات الأكل وPTSD.',
      en: 'OT in mental health and psychiatry, specialising in eating disorders, PTSD, and post-psychiatric-hospitalisation rehabilitation.',
    },
    photo: 'https://i.pravatar.cc/150?u=shira-landau',
    mohRegistrationNumber: 'MOH-66789',
    specialisations: ['mental-health'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.8983, 32.1663], city: 'רמת גן', address: 'רחוב ביאליק 15, רמת גן' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['maccabi', 'meuhedet', 'leumit'],
    feeRange: { min: 400, max: 460, currency: 'ILS' as const },
    contactEmail: 'shira.landau@therapio.co.il',
    contactPhone: '054-667-7889',
    subscriptionTier: 'premium' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'avi-nachshon',
    displayName: { he: 'אבי נחשון', ar: 'أفي ناحشون', en: 'Avi Nachshon' },
    bio: {
      he: 'מרפא בעיסוק בתחום גריאטריה ודמנציה. מתמחה בפרקינסון ואלצהיימר ובהתאמת הסביבה לשמירה על עצמאות.',
      ar: 'معالج وظيفي في مجال رعاية كبار السن والخرف. متخصص في مرضى باركنسون والزهايمر.',
      en: 'OT in geriatrics and dementia, specialising in Parkinson\'s, Alzheimer\'s and environmental adaptations for independence.',
    },
    photo: 'https://i.pravatar.cc/150?u=avi-nachshon',
    mohRegistrationNumber: 'MOH-77890',
    specialisations: ['geriatrics', 'neurological'],
    languages: ['he', 'ru', 'en'],
    location: { type: 'Point' as const, coordinates: [34.9024, 32.0819], city: 'פתח תקווה', address: 'רחוב אחד העם 88, פתח תקווה' },
    sessionTypes: ['in-person', 'home-visit'],
    insuranceAccepted: ['clalit', 'maccabi', 'leumit'],
    feeRange: { min: 370, max: 420, currency: 'ILS' as const },
    contactEmail: 'avi.nachshon@therapio.co.il',
    contactPhone: '050-778-8900',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'male' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'maya-reuveni',
    displayName: { he: 'מיה ראובני', ar: 'مايا رئوفيني', en: 'Maya Reuveni' },
    bio: {
      he: 'מרפאה בעיסוק ילדים עם ניסיון בשיקום אחרי פציעות אורתופדיות. מסייעת לילדים לחזור לפעילות יומיומית ולמשחק.',
      ar: 'معالجة وظيفية للأطفال بخبرة في إعادة التأهيل بعد الإصابات العظمية.',
      en: 'Paediatric OT specialising in post-orthopedic rehabilitation, helping children return to daily activities and play.',
    },
    photo: 'https://i.pravatar.cc/150?u=maya-reuveni',
    mohRegistrationNumber: 'MOH-88901',
    specialisations: ['paediatrics', 'hand-therapy'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.9896, 32.7940], city: 'חיפה', address: 'רחוב הגפן 5, חיפה' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['clalit', 'maccabi'],
    feeRange: { min: 380, max: 420, currency: 'ILS' as const },
    contactEmail: 'maya.reuveni@therapio.co.il',
    contactPhone: '052-889-9001',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: false,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'dan-zarchi',
    displayName: { he: 'דן זרחי', ar: 'دان زارحي', en: 'Dan Zarchi' },
    bio: {
      he: 'מרפא בעיסוק בתחום השיקום הקוגניטיבי. מתמחה בשיקום אחרי פגיעת מוח, ניהול זמן, זיכרון וכישורי ארגון.',
      ar: 'معالج وظيفي في مجال إعادة التأهيل الإدراكي. متخصص في إعادة التأهيل بعد إصابات الدماغ.',
      en: 'OT in cognitive rehabilitation, specialising in post-brain-injury recovery, time management, memory, and executive function.',
    },
    photo: 'https://i.pravatar.cc/150?u=dan-zarchi',
    mohRegistrationNumber: 'MOH-99012',
    specialisations: ['neurological', 'mental-health'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.7818, 32.0853], city: 'תל אביב', address: 'רחוב אלנבי 90, תל אביב' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['maccabi', 'meuhedet', 'leumit'],
    feeRange: { min: 420, max: 480, currency: 'ILS' as const },
    contactEmail: 'dan.zarchi@therapio.co.il',
    contactPhone: '054-990-0112',
    subscriptionTier: 'premium' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'male' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'rachel-stern',
    displayName: { he: 'רחל שטרן', ar: 'راحيل ستيرن', en: 'Rachel Stern' },
    bio: {
      he: 'מרפאה בעיסוק המתמחה בגישת SI (אינטגרציה חושית) לפי Ayres לטיפול בילדים. בעלת הסמכה בינלאומית.',
      ar: 'معالجة وظيفية متخصصة في نهج التكامل الحسي وفق Ayres لعلاج الأطفال. حاصلة على اعتماد دولي.',
      en: 'OT specialising in Ayres Sensory Integration (ASI) for children, internationally certified. Works with SPD and autism spectrum.',
    },
    photo: 'https://i.pravatar.cc/150?u=rachel-stern',
    mohRegistrationNumber: 'MOH-10023',
    specialisations: ['sensory-processing', 'paediatrics'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.7818, 32.0853], city: 'תל אביב', address: 'רחוב נחלת בנימין 30, תל אביב' },
    sessionTypes: ['in-person'],
    insuranceAccepted: ['maccabi', 'leumit'],
    feeRange: { min: 450, max: 500, currency: 'ILS' as const },
    contactEmail: 'rachel.stern@therapio.co.il',
    contactPhone: '050-100-2234',
    subscriptionTier: 'premium' as const,
    isFeatured: true,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
  {
    slug: 'tal-sela',
    displayName: { he: 'טל סלע', ar: 'طال سيلاع', en: 'Tal Sela' },
    bio: {
      he: 'מרפאה בעיסוק בתחום שיקום נוירולוגי עם התמחות ב-Virtual Reality לשיקום. חוקרת ומפתחת שיטות טיפול חדשניות.',
      ar: 'معالجة وظيفية في مجال إعادة التأهيل العصبي مع تخصص في الواقع الافتراضي للعلاج.',
      en: 'OT in neurological rehabilitation with a speciality in VR-assisted therapy. Researcher and developer of innovative treatment methods.',
    },
    photo: 'https://i.pravatar.cc/150?u=tal-sela',
    mohRegistrationNumber: 'MOH-10124',
    specialisations: ['neurological'],
    languages: ['he', 'en'],
    location: { type: 'Point' as const, coordinates: [34.8983, 32.1663], city: 'רמת גן', address: 'שדרות ירושלים 120, רמת גן' },
    sessionTypes: ['in-person', 'telehealth'],
    insuranceAccepted: ['clalit', 'maccabi'],
    feeRange: { min: 440, max: 500, currency: 'ILS' as const },
    contactEmail: 'tal.sela@therapio.co.il',
    contactPhone: '052-101-2345',
    subscriptionTier: 'free' as const,
    isFeatured: false,
    isAcceptingPatients: true,
    gender: 'female' as const,
    mohStatus: 'בתוקף',
    isActive: true,
  },
];

async function seed() {
  console.log(`Connecting to ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  let created = 0;
  let updated = 0;

  for (const p of profiles) {
    // Upsert TherapistProfile
    const result = await TherapistProfile.updateOne(
      { slug: p.slug },
      { $set: p },
      { upsert: true }
    );
    if (result.upsertedCount) created++;
    else if (result.modifiedCount) updated++;

    // Upsert linked User account — mirrors what onboarding/complete creates
    const profileDoc = await TherapistProfile.findOne({ slug: p.slug }).lean();
    if (profileDoc) {
      await User.findOneAndUpdate(
        { email: p.contactEmail },
        {
          $setOnInsert: {
            email: p.contactEmail,
            name: p.displayName.en ?? p.displayName.he,
            passwordHash,
            emailVerified: true,
          },
          $set: { role: 'therapist', therapistProfileId: profileDoc._id },
        },
        { upsert: true }
      );
    }
  }

  console.log(`Seed complete: ${created} created, ${updated} updated, ${profiles.length} total.`);
  console.log(`Therapist login: email = <contactEmail>  password = ${SEED_PASSWORD}`);

  // ── Seed reviewer users (no role — anonymous reviewers for seeded reviews) ─
  console.log('\nSeeding reviewer users...');
  const seedReviewerDefs = [
    { email: 'yael.cohen@seed.therapio.co.il', name: 'Yael Cohen' },
    { email: 'roi.benmoshe@seed.therapio.co.il', name: 'Roi Ben-Moshe' },
    { email: 'nadia.petrov@seed.therapio.co.il', name: 'Nadia Petrov' },
  ];

  const reviewerDocs = await Promise.all(
    seedReviewerDefs.map((p) =>
      User.findOneAndUpdate(
        { email: p.email },
        { $setOnInsert: { ...p, passwordHash: '', role: null, emailVerified: true } },
        { upsert: true, new: true }
      )
    )
  );
  const [yael, roi, nadia] = reviewerDocs;
  console.log(`  Reviewer users ready: ${reviewerDocs.map((u) => u!.name).join(', ')}`);

  // ── Seed reviews ──────────────────────────────────────────────────────────
  console.log('\nSeeding reviews...');

  const reviewDefs = [
    // michal-cohen — avg 4.5 (2 reviews)
    { slug: 'michal-cohen', userId: yael!._id, rating: 5, text: 'מיכל מדהימה! הילד שלי עשה קפיצת מדרגה עצומה תוך חודשיים בלבד. הגישה המבוססת משחק שלה שמרה עליו מעוניין ומתקדם כל הזמן. ממליצה בחום לכל הורה שמחפש ריפוי בעיסוק לילדים.' },
    { slug: 'michal-cohen', userId: roi!._id, rating: 4, text: 'מקצועית מאוד ויש לה ידע רב בעיבוד חושי. קצת קשה לקבל תורים בגלל הביקוש הגבוה, אבל שווה את ההמתנה. הבת שלי נהנית מהטיפולים וכבר רואים שיפור משמעותי.' },
    // yosef-levi — avg 5.0 (2 reviews)
    { slug: 'yosef-levi', userId: yael!._id, rating: 5, text: 'יוסף עזר לאמא שלי להתאושש מהר מהשבץ. הוא מסביר הכל בצורה ברורה, סבלני ומעודד. כבר לאחר שישה טיפולים היא יכולה לבצע פעולות יומיומיות שחשבנו שלא תחזור אליהן. מרפא מצוין בכל הקריטריונים.' },
    { slug: 'yosef-levi', userId: nadia!._id, rating: 5, text: 'Professional and very attentive to my father\'s specific needs post-Parkinson\'s diagnosis. Yosef creates personalised exercises and follows up between sessions. We have seen remarkable improvement in fine motor skills and daily independence. Highly recommend.' },
    // hana-shapira — avg 4.0 (2 reviews)
    { slug: 'hana-shapira', userId: roi!._id, rating: 4, text: 'חנה מקצועית מאוד ויש לה ניסיון עשיר עם קשישים. הסבתא שלי מגיעה לטיפולים בשמחה, וזה אומר הכל. הייתי שמח אם שעות הקבלה היו גמישות יותר, אבל הטיפול עצמו מצוין.' },
    { slug: 'hana-shapira', userId: nadia!._id, rating: 4, text: 'Excellent geriatric specialist. Hana helped my grandmother regain confidence after her hip replacement surgery. The home visit option was invaluable for us. Communication is clear and she always listens to family concerns.' },
    // orna-friedman — avg 4.5 (2 reviews)
    { slug: 'orna-friedman', userId: nadia!._id, rating: 5, text: 'אורנה היא מרפאה ברמה הגבוהה ביותר. עבדה עם בעלי לאחר תאונת דרכים עם פגיעת ראש, ותוצאות הטיפול חרגו מכל הציפיות שלנו. היא משלבת ניסיון עשיר עם שיטות מתקדמות וטכנולוגיה. בלתי ניתן לדמיין טוב ממנה.' },
    { slug: 'orna-friedman', userId: yael!._id, rating: 4, text: 'Senior therapist with vast knowledge. My husband benefited greatly from her neurological rehabilitation programme. Very structured approach, great communication with the medical team. Slightly long waiting list but worth it.' },
    // rachel-stern — avg 5.0 (2 reviews)
    { slug: 'rachel-stern', userId: roi!._id, rating: 5, text: 'רחל מומחית ב-SI ברמה בינלאומית. הבן שלי עם SPD לא רצה לצאת מהטיפולים — זה סימן לאיכות של מרפא. תוך שלושה חודשים ראינו שינוי דרמטי בוויסות הרגשי ובהתנהגות שלו בגן.' },
    { slug: 'rachel-stern', userId: yael!._id, rating: 5, text: 'Rachel is exceptional — her ASI certification really shows in practice. My daughter has autism spectrum and Rachel found exactly the right sensory diet for her. The clinic environment is thoughtfully designed. Best investment we made for our child.' },
    // eli-ben-david — avg 5.0 (1 review)
    { slug: 'eli-ben-david', userId: roi!._id, rating: 5, text: 'אלי עובד עם הבן שלי עם שיתוק מוחי כבר שנה וחצי. הוא מביא אנרגיה מדהימה, אבל גם ידע רציני ומחויבות אמיתית. גן הילדים שלנו ציין שיפור משמעותי בתפקוד, ואנחנו בטוחים שזה בזכות הטיפול אצל אלי.' },
    // dan-zarchi — avg 4.0 (1 review)
    { slug: 'dan-zarchi', userId: nadia!._id, rating: 4, text: 'Dan helped me significantly with cognitive rehabilitation following a workplace accident. His structured approach to memory and executive function training gave me practical tools I use daily. Professional, knowledgeable and encouraging throughout the process.' },
  ];

  // Group by slug to process OT by OT
  const slugsWithReviews = [...new Set(reviewDefs.map((r) => r.slug))];

  let reviewsCreated = 0;
  let reviewsUpdated = 0;

  for (const slug of slugsWithReviews) {
    const profile = await TherapistProfile.findOne({ slug }).lean();
    if (!profile) { console.warn(`  Profile not found: ${slug} — skipping`); continue; }

    const defs = reviewDefs.filter((r) => r.slug === slug);

    for (const def of defs) {
      const res = await Review.updateOne(
        { userId: def.userId, therapistProfileId: profile._id },
        { $set: { rating: def.rating, text: def.text, isApproved: true } },
        { upsert: true }
      );
      if (res.upsertedCount) reviewsCreated++;
      else if (res.modifiedCount) reviewsUpdated++;
    }

    // Recalculate rating stats
    const agg = await Review.aggregate<{ avg: number; count: number }>([
      { $match: { therapistProfileId: profile._id, isApproved: true } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const ratingAvg = agg.length ? Math.round(agg[0].avg * 10) / 10 : 0;
    const ratingCount = agg.length ? agg[0].count : 0;
    await TherapistProfile.updateOne({ _id: profile._id }, { $set: { ratingAvg, ratingCount } });
    console.log(`  ${slug}: ${ratingCount} reviews, avg ${ratingAvg}`);
  }

  console.log(`\nReviews: ${reviewsCreated} created, ${reviewsUpdated} updated.`);

  // ── Seed patient management data for michal-cohen ─────────────────────────
  console.log('\nSeeding patient management data (michal-cohen)...');

  const michalUser = await User.findOne({ email: 'michal.cohen@therapio.co.il' }).lean();
  if (!michalUser) {
    console.warn('  michal-cohen user not found — skipping patient management seed');
  } else {
    const therapistOid = michalUser._id;

    // Clear existing patient-management seed data for this therapist
    await Patient.deleteMany({ therapistId: therapistOid });
    await Invoice.deleteMany({ therapistId: therapistOid });
    await TreatmentSession.deleteMany({ therapistId: therapistOid });
    await Appointment.deleteMany({ therapistId: therapistOid });
    await Goal.deleteMany({ therapistId: therapistOid });
    await Counter.deleteOne({ _id: `invoice:${String(therapistOid)}` });

    const now = new Date();
    const sevenYearsOut = new Date(now.getFullYear() + 7, now.getMonth(), now.getDate());

    // ── Patients ─────────────────────────────────────────────────────────────
    const patientDefs = [
      {
        firstName: 'יעל', lastName: 'אבי',
        type: 'direct' as const, dateOfBirth: new Date('1990-03-15'), gender: 'female' as const,
        insurance: 'clalit' as const, status: 'active' as const,
        contactInfo: { phone: '050-111-2222', email: 'yael.avi@example.com' },
        consentSignedBy: 'יעל אבי',
      },
      {
        firstName: 'משה', lastName: 'כהן',
        type: 'direct' as const, dateOfBirth: new Date('1983-07-22'), gender: 'male' as const,
        insurance: 'maccabi' as const, status: 'active' as const,
        contactInfo: { phone: '052-333-4444' },
        consentSignedBy: 'משה כהן',
      },
      {
        firstName: 'ליאה', lastName: 'פרץ',
        type: 'child' as const, dateOfBirth: new Date('2017-11-10'), gender: 'female' as const,
        insurance: 'meuhedet' as const, status: 'active' as const,
        parentInfo: { firstName: 'דוד', lastName: 'פרץ', phone: '054-555-6666', relationship: 'father' as const },
        consentSignedBy: 'דוד פרץ',
      },
      {
        firstName: 'דוד', lastName: 'כץ',
        type: 'direct' as const, dateOfBirth: new Date('1970-05-30'), gender: 'male' as const,
        insurance: 'leumit' as const, status: 'active' as const,
        contactInfo: { phone: '050-777-8888' },
        consentSignedBy: 'דוד כץ',
      },
      {
        firstName: 'שרה', lastName: 'מזרחי',
        type: 'direct' as const, dateOfBirth: new Date('1997-12-05'), gender: 'female' as const,
        insurance: 'none' as const, status: 'active' as const,
        contactInfo: { phone: '052-999-0000' },
        consentSignedBy: 'שרה מזרחי',
      },
      {
        firstName: 'אבי', lastName: 'בן-עמי',
        type: 'child' as const, dateOfBirth: new Date('2019-04-18'), gender: 'male' as const,
        insurance: 'clalit' as const, status: 'active' as const,
        parentInfo: { firstName: 'רחל', lastName: 'בן-עמי', phone: '054-001-1112', relationship: 'mother' as const },
        consentSignedBy: 'רחל בן-עמי',
      },
      {
        firstName: 'נועה', lastName: 'שפירא',
        type: 'direct' as const, dateOfBirth: new Date('1994-08-25'), gender: 'female' as const,
        insurance: 'maccabi' as const, status: 'active' as const,
        contactInfo: { phone: '050-223-3334' },
        consentSignedBy: 'נועה שפירא',
      },
      {
        firstName: 'רון', lastName: 'לוי',
        type: 'direct' as const, dateOfBirth: new Date('1977-01-12'), gender: 'male' as const,
        insurance: 'clalit' as const, status: 'inactive' as const,
        contactInfo: { phone: '052-445-5556' },
        consentSignedBy: 'רון לוי',
      },
      {
        firstName: 'טל', lastName: 'דגן',
        type: 'child' as const, dateOfBirth: new Date('2020-09-03'), gender: 'female' as const,
        insurance: 'none' as const, status: 'active' as const,
        parentInfo: { firstName: 'אירית', lastName: 'דגן', phone: '054-667-7778', relationship: 'mother' as const },
        consentSignedBy: 'אירית דגן',
      },
      {
        firstName: 'איתי', lastName: 'פרידמן',
        type: 'direct' as const, dateOfBirth: new Date('1962-06-14'), gender: 'male' as const,
        insurance: 'maccabi' as const, status: 'active' as const,
        contactInfo: { phone: '050-889-9900' },
        consentSignedBy: 'איתי פרידמן',
      },
    ];

    const consentDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const patients = await Patient.insertMany(
      patientDefs.map((pd) => ({
        therapistId: therapistOid,
        consentGiven: true,
        consentDate,
        retentionDeleteAfter: sevenYearsOut,
        ...pd,
      }))
    );
    console.log(`  Created ${patients.length} patients`);

    // ── Helper: date N days ago at a given hour ───────────────────────────
    function daysAgoAt(n: number, hour: number, minute = 0): Date {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      d.setHours(hour, minute, 0, 0);
      return d;
    }

    // ── Completed appointments spread over 8 weeks (~56 days) ────────────
    // Format: [daysAgo, hour, patientIdx, type]
    const completedDefs: Array<[number, number, number, 'in-person' | 'telehealth']> = [
      // Week 8 (days 49-55)
      [54, 9, 0, 'in-person'], [52, 11, 3, 'telehealth'], [50, 14, 6, 'in-person'],
      // Week 7 (days 42-48)
      [47, 9, 0, 'in-person'], [46, 10, 1, 'in-person'],
      [44, 11, 4, 'telehealth'], [43, 14, 6, 'in-person'],
      // Week 6 (days 35-41)
      [40, 9, 2, 'in-person'], [40, 11, 0, 'in-person'],
      [38, 10, 1, 'telehealth'], [37, 9, 5, 'in-person'], [36, 14, 3, 'in-person'],
      // Week 5 (days 28-34)
      [33, 9, 0, 'in-person'], [33, 11, 7, 'in-person'],
      [31, 10, 2, 'telehealth'], [31, 14, 4, 'in-person'],
      [29, 9, 6, 'in-person'], [28, 11, 9, 'telehealth'],
      // Week 4 (days 21-27)
      [26, 9, 0, 'in-person'], [26, 11, 3, 'in-person'],
      [24, 10, 1, 'telehealth'], [23, 9, 5, 'in-person'],
      [23, 14, 8, 'in-person'], [21, 11, 2, 'in-person'],
      // Week 3 (days 14-20)
      [19, 9, 0, 'in-person'], [19, 11, 6, 'in-person'],
      [17, 10, 3, 'telehealth'], [17, 14, 9, 'in-person'],
      [15, 9, 1, 'in-person'], [15, 11, 4, 'telehealth'], [14, 9, 7, 'in-person'],
      // Week 2 (days 7-13)
      [12, 9, 0, 'in-person'], [12, 11, 2, 'in-person'],
      [10, 10, 5, 'telehealth'], [10, 14, 3, 'in-person'],
      [8, 9, 8, 'in-person'], [8, 11, 6, 'in-person'],
      [7, 9, 1, 'telehealth'], [7, 14, 9, 'in-person'],
      // Week 1 (days 1-6)
      [5, 9, 0, 'in-person'], [5, 11, 4, 'telehealth'],
      [3, 10, 2, 'in-person'], [3, 14, 7, 'in-person'],
      [2, 9, 5, 'in-person'], [2, 11, 1, 'telehealth'],
    ];

    const completedAppts = await Appointment.insertMany(
      completedDefs.map(([ago, hour, pi, type]) => {
        const startTime = daysAgoAt(ago, hour);
        return {
          therapistId: therapistOid,
          patientId: patients[pi]._id,
          startTime,
          endTime: new Date(startTime.getTime() + 45 * 60 * 1000),
          duration: 45,
          type,
          status: 'completed',
          bookedBy: 'therapist',
          fee: 400,
        };
      })
    );
    console.log(`  Created ${completedAppts.length} completed appointments`);

    // ── Today's appointments ──────────────────────────────────────────────
    const todayBase = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayApptDefs: Array<[number, number, number, 'in-person' | 'telehealth']> = [
      [9, 0, 0, 'in-person'],
      [10, 0, 3, 'telehealth'],
      [11, 30, 6, 'in-person'],
      [14, 0, 2, 'in-person'],
    ];
    await Appointment.insertMany(
      todayApptDefs.map(([hour, minute, pi, type]) => {
        const startTime = new Date(todayBase);
        startTime.setHours(hour, minute, 0, 0);
        return {
          therapistId: therapistOid,
          patientId: patients[pi]._id,
          startTime,
          endTime: new Date(startTime.getTime() + 45 * 60 * 1000),
          duration: 45,
          type,
          status: startTime < now ? 'completed' : 'scheduled',
          bookedBy: 'therapist',
          fee: 400,
        };
      })
    );
    console.log('  Created today\'s appointments');

    // ── Treatment sessions (one per completed appointment) ─────────────────
    const sessions = await TreatmentSession.insertMany(
      completedAppts.map((appt) => ({
        therapistId: therapistOid,
        patientId: appt.patientId,
        appointmentId: appt._id,
        date: appt.startTime,
        duration: 45,
        fee: 400,
        aiDraftUsed: false,
        status: 'signed',
        signedAt: new Date((appt.startTime as Date).getTime() + 60 * 60 * 1000),
        notes: { freeText: 'הטיפול התנהל בצורה תקינה. ניכר שיפור בביצוע המטלות.' },
      }))
    );
    console.log(`  Created ${sessions.length} treatment sessions`);

    // Update lastTreatmentDate on each patient
    for (const appt of completedAppts) {
      await Patient.updateOne(
        {
          _id: appt.patientId,
          $or: [{ lastTreatmentDate: { $exists: false } }, { lastTreatmentDate: { $lt: appt.startTime } }],
        },
        { $set: { lastTreatmentDate: appt.startTime } }
      );
    }

    // ── Invoices ──────────────────────────────────────────────────────────
    // Paid invoices over 6 months → revenue chart
    // Some sent/overdue → outstanding balance KPI
    type InvStatus = 'paid' | 'sent' | 'overdue';
    const invoiceDefs: Array<{
      pi: number; monthsAgo: number; day: number;
      sessions: number; fee: number; status: InvStatus;
    }> = [
      // 5 months ago  (~5,500 ILS)
      { pi: 0, monthsAgo: 5, day: 5,  sessions: 4, fee: 400, status: 'paid' },
      { pi: 1, monthsAgo: 5, day: 9,  sessions: 3, fee: 420, status: 'paid' },
      { pi: 3, monthsAgo: 5, day: 14, sessions: 4, fee: 400, status: 'paid' },
      // 4 months ago  (~8,200 ILS)
      { pi: 0, monthsAgo: 4, day: 4,  sessions: 4, fee: 400, status: 'paid' },
      { pi: 1, monthsAgo: 4, day: 7,  sessions: 4, fee: 420, status: 'paid' },
      { pi: 2, monthsAgo: 4, day: 10, sessions: 3, fee: 430, status: 'paid' },
      { pi: 4, monthsAgo: 4, day: 15, sessions: 4, fee: 400, status: 'paid' },
      // 3 months ago — holiday dip  (~4,900 ILS)
      { pi: 0, monthsAgo: 3, day: 5,  sessions: 3, fee: 400, status: 'paid' },
      { pi: 1, monthsAgo: 3, day: 8,  sessions: 2, fee: 420, status: 'paid' },
      { pi: 6, monthsAgo: 3, day: 13, sessions: 4, fee: 400, status: 'paid' },
      // 2 months ago  (~9,800 ILS)
      { pi: 0, monthsAgo: 2, day: 4,  sessions: 4, fee: 400, status: 'paid' },
      { pi: 1, monthsAgo: 2, day: 6,  sessions: 4, fee: 420, status: 'paid' },
      { pi: 3, monthsAgo: 2, day: 9,  sessions: 4, fee: 450, status: 'paid' },
      { pi: 5, monthsAgo: 2, day: 13, sessions: 4, fee: 400, status: 'paid' },
      { pi: 9, monthsAgo: 2, day: 17, sessions: 3, fee: 430, status: 'paid' },
      // 1 month ago  (~11,800 ILS)
      { pi: 0, monthsAgo: 1, day: 4,  sessions: 4, fee: 400, status: 'paid' },
      { pi: 1, monthsAgo: 1, day: 5,  sessions: 4, fee: 420, status: 'paid' },
      { pi: 2, monthsAgo: 1, day: 8,  sessions: 4, fee: 430, status: 'paid' },
      { pi: 4, monthsAgo: 1, day: 10, sessions: 4, fee: 400, status: 'paid' },
      { pi: 6, monthsAgo: 1, day: 13, sessions: 4, fee: 400, status: 'paid' },
      { pi: 9, monthsAgo: 1, day: 16, sessions: 4, fee: 430, status: 'paid' },
      // Current month  (~7,600 ILS paid so far)
      { pi: 0, monthsAgo: 0, day: 3,  sessions: 4, fee: 400, status: 'paid' },
      { pi: 1, monthsAgo: 0, day: 5,  sessions: 4, fee: 420, status: 'paid' },
      { pi: 3, monthsAgo: 0, day: 7,  sessions: 3, fee: 450, status: 'paid' },
      { pi: 5, monthsAgo: 0, day: 9,  sessions: 3, fee: 400, status: 'paid' },
      // Outstanding invoices
      { pi: 4, monthsAgo: 0, day: 2,  sessions: 4, fee: 400, status: 'sent' },
      { pi: 7, monthsAgo: 1, day: 3,  sessions: 4, fee: 420, status: 'overdue' },
      { pi: 8, monthsAgo: 0, day: 5,  sessions: 3, fee: 430, status: 'sent' },
    ];

    let invoiceSeq = 1;
    const invoices = await Invoice.insertMany(
      invoiceDefs.map((def) => {
        const invoiceNumber = `INV-${String(invoiceSeq++).padStart(4, '0')}`;
        const issueDate = new Date(now.getFullYear(), now.getMonth() - def.monthsAgo, def.day);
        const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const subtotal = def.sessions * def.fee;
        const vatAmount = Math.round(subtotal * 0.18);
        const total = subtotal + vatAmount;
        const patient = patients[def.pi];
        return {
          therapistId: therapistOid,
          patientId: patient._id,
          invoiceNumber,
          issueDate,
          dueDate,
          therapistName: 'מיכל כהן',
          therapistLicense: 'MOH-12345',
          patientName: `${patient.firstName} ${patient.lastName}`,
          lineItems: [{
            description: `ריפוי בעיסוק — ${def.sessions} טיפולים`,
            quantity: def.sessions,
            unitPrice: def.fee,
            sessionIds: [],
          }],
          subtotal,
          vatRate: 0.18,
          vatAmount,
          total,
          type: 'invoice_receipt' as const,
          status: def.status,
          ...(def.status === 'paid' ? {
            paidAt: new Date(issueDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            paidAmount: total,
          } : {}),
        };
      })
    );
    const paidCount = invoiceDefs.filter((d) => d.status === 'paid').length;
    const outstandingCount = invoiceDefs.filter((d) => d.status !== 'paid').length;
    console.log(`  Created ${invoices.length} invoices (${paidCount} paid, ${outstandingCount} outstanding)`);

    // ── Goals ─────────────────────────────────────────────────────────────
    const goalDefs = [
      { pi: 0, title: 'שיפור טווח תנועה ביד ימין',               status: 'active' as const,   targetWeeks: 12 },
      { pi: 1, title: 'תפקוד יומיומי — לבישה עצמאית',            status: 'achieved' as const, targetWeeks: 8  },
      { pi: 2, title: 'פיתוח יכולת כתיבה ומוטוריקה עדינה',       status: 'active' as const,   targetWeeks: 16 },
      { pi: 3, title: 'חיזוק שרירי הגריפה והאחיזה',              status: 'active' as const,   targetWeeks: 10 },
      { pi: 4, title: 'הפחתת חרדה בסביבה חברתית',               status: 'active' as const,   targetWeeks: 12 },
      { pi: 5, title: 'שיפור עיבוד חושי — סבילות למגע',          status: 'active' as const,   targetWeeks: 20 },
      { pi: 6, title: 'שיפור יציבה בישיבה ממושכת',               status: 'achieved' as const, targetWeeks: 8  },
      { pi: 9, title: 'שיפור קואורדינציה עין-יד',                status: 'active' as const,   targetWeeks: 16 },
    ];

    await Goal.insertMany(
      goalDefs.map((g) => ({
        therapistId: therapistOid,
        patientId: patients[g.pi]._id,
        title: g.title,
        targetDate: new Date(now.getTime() + g.targetWeeks * 7 * 24 * 60 * 60 * 1000),
        status: g.status,
        progressEntries: [],
        ...(g.status === 'achieved' ? { achievedDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } : {}),
      }))
    );
    console.log(`  Created ${goalDefs.length} goals`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
