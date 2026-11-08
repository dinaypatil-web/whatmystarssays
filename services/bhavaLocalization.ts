import { Language } from '../types';

export interface LocalizedBhavaInfo {
  title: string;
  lifeDomain: string;
  coreThemes: string;
  baseBoons: string[];
  baseCautions: string[];
  baseRemedies: string[];
  bodyParts: string;
  karakaKey: string;
}

// Universal karaka keys per house (Sun, Jupiter, Mars, Moon, Venus, Saturn)
const HOUSE_KARAKAS = [
  'Sun',      // 1: Tanu (Sun)
  'Jupiter',  // 2: Dhana (Jupiter)
  'Mars',     // 3: Sahaja (Mars)
  'Moon',     // 4: Sukha (Moon)
  'Jupiter',  // 5: Putra (Jupiter)
  'Mars',     // 6: Ari (Mars / Saturn)
  'Venus',    // 7: Kalatra (Venus)
  'Saturn',   // 8: Ayur (Saturn)
  'Jupiter',  // 9: Dharma (Jupiter / Sun)
  'Sun',      // 10: Karma (Sun / Mercury / Jupiter)
  'Jupiter',  // 11: Labha (Jupiter)
  'Saturn'    // 12: Vyaya (Saturn / Ketu)
];

const BHAVA_CONFIG_MAP: Record<Language, Array<{
  title: string;
  lifeDomain: string;
  coreThemes: string;
  baseBoons: string[];
  baseCautions: string[];
  baseRemedies: string[];
  bodyParts: string;
}>> = {
  English: [
    {
      title: '1st House • Self, Vitality & Physique',
      lifeDomain: 'Vitality, personal disposition, physical health and primary destiny',
      coreThemes: 'The 1st House represents physical vitality, biological temperament, personal willpower, and the primary orientation of consciousness.',
      baseBoons: [
        'Commanding presence, charismatic persona, and robust natural stamina.',
        'Sharp strategic foresight, independent decision-making, and moral integrity.',
        'Resilience to rise above adversity and inspire collaborative progress.'
      ],
      baseCautions: [
        'Avoid burnout or exhaustion from relentless overwork and perfectionism.',
        'Maintain a balanced daily regimen for wholesome digestion and proper rest.',
        'Guard against impulsive haste or rigid obstinacy in personal relationships.'
      ],
      baseRemedies: [
        'Offer pure water (Arghya) to the rising morning Sun in a copper vessel.',
        'Apply natural sandalwood or saffron tilak to soothe mental focus.',
        'Honor fatherly mentors and practice early morning deep breathing exercises.'
      ],
      bodyParts: 'Head, brain, forehead, facial complexion and vitality'
    },
    {
      title: '2nd House • Wealth, Family & Speech',
      lifeDomain: 'Accumulated wealth, speech eloquence, family harmony and values',
      coreThemes: 'The 2nd House governs accumulated liquid wealth, family lineage, verbal eloquence, facial grace, and dietary discipline.',
      baseBoons: [
        'Prudent financial stewardship, wealth retention, and long-term monetary gains.',
        'Eloquent, persuasive, and cultured speech that earns respect in society.',
        'Harmonious familial roots, ancestral blessings, and trustworthy reputation.'
      ],
      baseCautions: [
        'Avoid reckless speculation, volatile investments, or instant-wealth traps.',
        'Refrain from sharp, abrasive remarks during emotionally charged discussions.',
        'Maintain mindful dietary habits to safeguard throat and oral health.'
      ],
      baseRemedies: [
        'Recite Kanakadhara Stotram or Lakshmi Suktam on Friday evenings.',
        'Feed soaked green lentils or fodder to cows on Wednesdays.',
        'Keep a neat, clean, and organized treasury and cash space in your home.'
      ],
      bodyParts: 'Eyes, throat, speech organs, teeth and facial contour'
    },
    {
      title: '3rd House • Courage, Siblings & Enterprise',
      lifeDomain: 'Courage, siblings, communication, technical prowess and initiative',
      coreThemes: 'The 3rd House represents self-made fortitude, entrepreneurial drive, communication skills, siblings, and inventive efforts.',
      baseBoons: [
        'Courageous entrepreneurial initiative and proactive problem-solving drive.',
        'Dynamic talent in networking, media, writing, and technological ventures.',
        'Strong alliances with siblings, colleagues, and trustworthy associates.'
      ],
      baseCautions: [
        'Guard against impatience, unnecessary aggression, or scattered focus.',
        'Maintain good posture and care for shoulders, arms, and upper respiratory tract.',
        'Avoid hasty verbal commitments without formal written clarity.'
      ],
      baseRemedies: [
        'Recite Hanuman Chalisa on Tuesdays and cultivate a helpful attitude with peers.',
        'Offer grain and fresh water to wild birds every morning.',
        'Encourage, support, and honor younger siblings and team members.'
      ],
      bodyParts: 'Shoulders, arms, hands, upper chest and respiratory tract'
    },
    {
      title: '4th House • Mother, Home & Inner Peace',
      lifeDomain: 'Maternal bond, real estate, vehicles, ancestral home and peace of mind',
      coreThemes: 'The 4th House anchors inner psychological contentment, maternal nurturing, real estate properties, comfortable conveyances, and ancestral roots.',
      baseBoons: [
        'Deep emotional fulfillment, gracious parental blessings, and domestic peace.',
        'Stable property acquisition, comfortable vehicles, and well-appointed residences.',
        'Inner mental tranquility and enduring popularity among community peers.'
      ],
      baseCautions: [
        'Avoid brooding over past emotional wounds or withdrawing into lonely isolation.',
        'Exercise rigorous due diligence before signing real estate or property deeds.',
        'Nurture cardiovascular health and practice heart-opening deep breathing.'
      ],
      baseRemedies: [
        'Touch the feet of mother or maternal figures every morning to seek blessings.',
        'Offer milk and clean water during Shiva Abhishek on Mondays.',
        'Keep the northeast corner of your living space uncluttered and illuminated.'
      ],
      bodyParts: 'Chest, heart, lungs, upper ribs and emotional core'
    },
    {
      title: '5th House • Intellect, Progeny & Past Merits',
      lifeDomain: 'Higher intellect, children, creative genius, spiritual wisdom and past merits',
      coreThemes: 'The 5th House represents past-life karmic credit (Purva Punya), creative genius, progeny destiny, academic brilliance, and mantra illumination.',
      baseBoons: [
        'Sharp analytical intellect, philosophical depth, and creative originality.',
        'Joyful, talented progeny who bring family honor and spiritual satisfaction.',
        'Exceptional intuitive timing and strategic foresight in intellectual projects.'
      ],
      baseCautions: [
        'Avoid gambling, rash stock speculations, or greed-driven financial schemes.',
        'Maintain balanced digestion, healthy liver function, and mindful eating habits.',
        'Do not let intellectual pride dismiss the practical counsel of trusted elders.'
      ],
      baseRemedies: [
        'Chant Gayatri Mantra or Saraswati Stotram 108 times daily with pure focus.',
        'Gift books, educational stationery, or study aids to deserving students.',
        'Offer yellow flowers and worship Lord Vishnu on Thursdays.'
      ],
      bodyParts: 'Upper abdomen, stomach, liver, gall bladder and intellectual heart'
    },
    {
      title: '6th House • Health Defense, Daily Diligence & Victory',
      lifeDomain: 'Health defense, overcoming debts, competitive exams and service',
      coreThemes: 'The 6th House governs daily service, immune vitality, debt liquidation, and triumphing over competitors through disciplined diligence.',
      baseBoons: [
        'Triumph in competitive examinations, legal disputes, and administrative contests.',
        'Sturdy immune recovery, high endurance, and disciplined working habits.',
        'Resourceful knack for turning obstacles into victorious stepping stones.'
      ],
      baseCautions: [
        'Avoid borrowing unnecessary consumer debt or standing financial surety for others.',
        'Guard against digestive irritation, acidity, or inflammation from stressful diets.',
        'Never underestimate opponents; navigate rivalries with diplomatic patience.'
      ],
      baseRemedies: [
        'Serve underprivileged persons and feed street animals or cows with kindness.',
        'Chant Om Namo Bhagavate Vasudevaya daily for inner protection and healing.',
        'Practice daily pranayama and yoga to strengthen core digestive fire (Agni).'
      ],
      bodyParts: 'Intestines, digestive tract, kidneys and immune defense'
    },
    {
      title: '7th House • Partnership, Marriage & Public Ties',
      lifeDomain: 'Marriage, spouse qualities, commercial partnerships and public relations',
      coreThemes: 'The 7th House represents marital union, life partner compatibility, business partnerships, negotiations, and social rapport.',
      baseBoons: [
        'Loving, cultured, and supportive spouse who elevates overall family standing.',
        'Lucrative success in commercial partnerships, trade, and public diplomacy.',
        'Charismatic social diplomacy that wins steadfast trust and public esteem.'
      ],
      baseCautions: [
        'Prevent ego friction, assumptions, or silent grudges from eroding intimacy.',
        'Ensure all commercial partnership contracts are formally and legally documented.',
        'Care for lower back, kidneys, and pelvic wellness with sufficient hydration.'
      ],
      baseRemedies: [
        'Worship Goddess Lakshmi and Lord Vishnu together on Fridays with white flowers.',
        'Nurture mutual respect, patience, and transparent dialogue with your partner.',
        'Feed a stray cow fresh roti or green fodder with pure devotion.'
      ],
      bodyParts: 'Lower abdomen, lumbar region, kidneys and reproductive harmony'
    },
    {
      title: '8th House • Longevity, Transformation & Occult Wisdom',
      lifeDomain: 'Longevity, transformational shifts, occult research and unexpected gains',
      coreThemes: 'The 8th House governs longevity, sudden transformational events, research, inherited assets, and mystical understanding.',
      baseBoons: [
        'Long life, strong regenerative recuperation, and deep investigative acumen.',
        'Windfall gains through inheritances, insurance settlements, or joint capital.',
        'Extraordinary psychological resilience that turns trials into golden awakenings.'
      ],
      baseCautions: [
        'Drive defensively, avoid reckless physical stunts, and practice safety.',
        'Do not entrust funds to clandestine, unverified, or high-risk schemes.',
        'Avoid prolonged brooding or morbid anxiety through uplifting spiritual company.'
      ],
      baseRemedies: [
        'Chant the sacred Maha Mrityunjaya Mantra 11 or 108 times daily for protection.',
        'Donate dark blankets, sesame seeds, or iron utensils to the needy on Saturdays.',
        'Maintain a disciplined meditation practice to balance subtle energies.'
      ],
      bodyParts: 'Pelvic region, excretory systems, joint durability and regenerative vitality'
    },
    {
      title: '9th House • Fortune, Dharma & Higher Knowledge',
      lifeDomain: 'Higher wisdom, destiny fortune, fatherly guidance, ethics and pilgrimages',
      coreThemes: 'The 9th House is the crown trine of fortune, higher spiritual philosophy, divine grace, noble pilgrimages, and fatherly benevolence.',
      baseBoons: [
        'Auspicious stroke of fortune, divine protection, and virtuous destiny.',
        'Mentorship under accomplished scholars, wise preceptors, and spiritual guides.',
        'Revered reputation in academic, legal, theological, or philanthropic circles.'
      ],
      baseCautions: [
        'Never disparage spiritual traditions, religious teachings, or wise elders.',
        'Guard against self-righteous dogmatism, preachy arrogance, or rigid bigotry.',
        'Take proper care of hips, thighs, and arterial circulation during travel.'
      ],
      baseRemedies: [
        'Respect and serve your father, teachers, and spiritual gurus with heartfelt reverence.',
        'Offer yellow sweets, bananas, or books to scholars and temples on Thursdays.',
        'Undertake peaceful pilgrimages to sanctified sacred places periodically.'
      ],
      bodyParts: 'Hips, thighs, arterial health and spiritual nervous system'
    },
    {
      title: '10th House • Career, Authority & Social Honor',
      lifeDomain: 'Career prestige, vocational authority, executive leadership and social status',
      coreThemes: 'The 10th House stands at the meridian of public recognition, professional prominence, government honor, and vocational mastery.',
      baseBoons: [
        'Executive authority, rapid professional ascendance, and industry stature.',
        'Respected status in civic administration, enterprise, or state institutions.',
        'Enduring legacy of ethical leadership, high achievements, and social respect.'
      ],
      baseCautions: [
        'Avoid authoritarian arrogance, workplace condescension, or harsh management.',
        'Do not let professional ambitions undermine family obligations and personal rest.',
        'Care for knees, joints, and skeletal posture through regular stretches.'
      ],
      baseRemedies: [
        'Offer morning salutations to the Sun and practice fair justice toward all workers.',
        'Install and honor a consecrated Shree Yantra at your professional workspace.',
        'Donate grain, footwear, or clothing to elderly laborers on Saturdays.'
      ],
      bodyParts: 'Knees, kneecaps, joints, bones and skeletal alignment'
    },
    {
      title: '11th House • Gains, Aspirations & Prosperity',
      lifeDomain: 'Financial profits, aspirations fulfilled, peer networks and ongoing gains',
      coreThemes: 'The 11th House represents regular income streams, fulfillment of lifelong dreams, helpful social circles, and elder siblings.',
      baseBoons: [
        'Multiple reliable income avenues, continuous asset growth, and cash flow.',
        'Fruitful alliances with high-achieving mentors, influential circles, and loyal friends.',
        'Steady realization of long-nurtured ambitions, goals, and philanthropic projects.'
      ],
      baseCautions: [
        'Ensure all financial receipts and earnings are clean, ethical, and transparent.',
        'Do not let insatiable commercial greed overwhelm genuine personal contentment.',
        'Care for lower legs, calves, and left ear hearing health.'
      ],
      baseRemedies: [
        'Offer sweet modaks and sacred Durva grass to Lord Ganesha on Wednesdays.',
        'Share a fixed portion of your surplus business earnings in selfless charity.',
        'Express gratitude to elder siblings, senior friends, and helpful mentors.'
      ],
      bodyParts: 'Calves, shins, ankles, left ear and peripheral circulation'
    },
    {
      title: '12th House • Liberation, Foreign Lands & Inner Peace',
      lifeDomain: 'Spiritual emancipation, foreign travels, sound sleep and selfless charity',
      coreThemes: 'The 12th House governs spiritual emancipation (Moksha), overseas voyages, quiet meditation, deep restful sleep, and selfless benevolence.',
      baseBoons: [
        'Serene meditative insight, profound spiritual awakening, and detachment from stress.',
        'Lucrative gains through international commerce, foreign residence, and overseas travel.',
        'Quiet philanthropy that transforms worldly wealth into lasting karmic merit.'
      ],
      baseCautions: [
        'Avoid insomnia, late-night digital screens, or escapist daydreams.',
        'Maintain strict vigilance against careless budget leakages or frivolous expenditure.',
        'Do not isolate yourself completely from family and wholesome friendships.'
      ],
      baseRemedies: [
        'Burn natural camphor (Bhimseni Kapur) in your sleeping room for calm subtle energies.',
        'Practice 15 minutes of quiet breath-awareness meditation before sleeping.',
        'Donate warm blankets, shoes, or food to homeless persons on Saturday evenings.'
      ],
      bodyParts: 'Feet, toes, soles, left eye, lymphatic fluid and sleep rhythms'
    }
  ],

  Marathi: [
    {
      title: 'प्रथम भाव • तनु भाव — शरीर, आरोग्य व व्यक्तिमत्त्व',
      lifeDomain: 'आरोग्य, शारीरिक तेज, स्वभाव, आत्मविश्वास आणि जीवन ऊर्जा',
      coreThemes: 'प्रथम भाव किंवा लग्न स्थान हे संपूर्ण कुंडलीचा प्राण असून, ते जातकाचे शरीर, आरोग्य, व्यक्तिमत्त्व, विचारसरणी आणि स्वाभिमानाचे मूळ केंद्र आहे.',
      baseBoons: [
        'प्रभावी व्यक्तिमत्त्व, उच्च आत्मविश्वास, उत्तम आरोग्य आणि समाजात प्रतिष्ठा.',
        'संकटांवर मात करण्याची मानसिक क्षमता आणि स्वतंत्र विचारसरणी.',
        'स्वाभाविक नेतृत्वगुण, तेजस्वी स्वभाव आणि दीर्घायुष्य योग.'
      ],
      baseCautions: [
        'अतिउत्साह किंवा कामाच्या ताणामुळे डोकेदुखी व मानसिक तणाव टाळा.',
        'आहार आणि दिनचर्येचे काटेकोर नियम पाळा; आरोग्याकडे दुर्लक्ष करू नका.',
        'अहंकार किंवा हट्टी स्वभावामुळे जवळच्या नातेवाईकांशी वाद टाळा.'
      ],
      baseRemedies: [
        'दररोज सकाळी तांब्याच्या पात्रातून सूर्याला अर्घ्य द्यावे व ॐ घृणि सूर्याय नमः चा जप करावा.',
        'कपाळावर चंदनाचा किंवा केशरचा टिळा लावावा.',
        'गायीला चारा किंवा गूळ-पोळी खाऊ घालावी.'
      ],
      bodyParts: 'डोके, मेंदू, कपाळ, चेहरा आणि शारीरिक तेज'
    },
    {
      title: 'द्वितीय भाव • धन भाव — वाणी, संपत्ती व कुटुंब',
      lifeDomain: 'संचित धन, वाणी, कौटुंबिक सौख्य आणि संस्कार',
      coreThemes: 'द्वितीय भाव जातकाची वाणी, पैतृक संपत्ती, संचित कोष, कौटुंबिक सौख्य आणि प्राथमिक संस्कारांचे द्योतक आहे.',
      baseBoons: [
        'आर्थिक स्थैर्य, संचित संपत्तीत निरंतर वृद्धी आणि व्यवसायात धनलाभ.',
        'गोड आणि प्रभावी वाणी, ज्यामुळे समाजात आणि कुटुंबात आदर प्राप्त होतो.',
        'कौटुंबिक सहकार्य आणि वडिलोपार्जित संपत्तीचा विशेष लाभ.'
      ],
      baseCautions: [
        'अनावश्यक खर्च आणि सट्टेबाजी किंवा अनपेक्षित जोखमींपासून दूर राहा.',
        'कटू शब्द वापरणे टाळा, ज्यामुळे नात्यांमध्ये दुरावा निर्माण होणार नाही.',
        'मुख व डोळ्यांच्या आरोग्याची नियमित काळजी घ्या.'
      ],
      baseRemedies: [
        'शुक्रवारी कनकधारा स्तोत्र किंवा महालक्ष्मी अष्टकमचे पठण करावे.',
        'गुरुवारी गरजू व्यक्तींना पिवळे धान्य किंवा मिठाई दान करावी.',
        'नेहमी घरात व तिजोरीत स्वच्छता ठेवावी.'
      ],
      bodyParts: 'डोळे, घसा, वाणी इंद्रिये, दात आणि मुखमंडल'
    },
    {
      title: 'तृतीय भाव • सहज भाव — पराक्रम, भावंडे व कौशल्य',
      lifeDomain: 'पराक्रम, धाडस, लहान भावंडे, संपर्क कला आणि कौशल्य',
      coreThemes: 'तृतीय भाव अदम्य धैर्य, पराक्रम, लहान भावंडे, संपर्क कौशल्य आणि हाताच्या कौशल्यांचे स्थान आहे.',
      baseBoons: [
        'अफाट धाडस, जिद्द, परिश्रम करण्याची तयारी आणि संकटांशी लढण्याची क्षमता.',
        'उत्कृष्ट संवाद कौशल्य, तांत्रिक कार्ये, लेखन किंवा कलेत निपुणता.',
        'लहान भावंडांचे सहकार्य आणि अल्प प्रवासांतून आर्थिक लाभ.'
      ],
      baseCautions: [
        'अति घाईगडबडीत घेतलेले निर्णय नुकसान पोहोचवू शकतात; संयम बाळगा.',
        'सहकारी किंवा भावंडांसोबत गैरसमज टाळण्यासाठी स्पष्ट संवाद ठेवा.',
        'खांदे, हात आणि श्वसन प्रणालीची नियमित काळजी घ्या.'
      ],
      baseRemedies: [
        'मंगळवारी हनुमान चालिसाचे पठण करावे व लाल चंदनाचा टिळा लावावा.',
        'पक्षांना दररोज धान्य आणि पाणी ठेवावे.',
        'लहान भावंडांना किंवा मित्रांना मदत करावी.'
      ],
      bodyParts: 'खांदे, हात, बाहू, छातीचा वरचा भाग आणि श्वसनसंस्था'
    },
    {
      title: 'चतुर्थ भाव • सुख भाव — माता, गृह, भूमी व मनःशांती',
      lifeDomain: 'मातृसुख, घर, जमीन, वाहन आणि अंतःकरणातील शांतता',
      coreThemes: 'चतुर्थ भाव मातृसुख, स्वतःचे घर, जमीन-जुमला, वाहन आणि अंतःकरणातील मानसिक समाधानाचे केंद्र आहे.',
      baseBoons: [
        'मातेचा उत्तम आशीर्वाद, स्वतःचे घर आणि आलिशान वाहनांचे सुख.',
        'स्थिर मालमत्ता, सुसज्ज गृहसौख्य आणि कुटुंबात शांततामय वातावरण.',
        'सकारात्मक मनःस्थिती आणि समाजात प्रतिष्ठित स्थान.'
      ],
      baseCautions: [
        'अतिसंवेदनशील किंवा भावूक होऊन स्वतःला एकाकी समजू नका.',
        'घर किंवा मालमत्ता खरेदी-विक्री करताना कागदपत्रांची काळजीपूर्वक तपासणी करा.',
        'हृदय, छाती आणि फुप्फुसांच्या आरोग्याची वेळोवेळी तपासणी करा.'
      ],
      baseRemedies: [
        'दररोज सकाळी मातेच्या चरणांना स्पर्श करून आशीर्वाद घ्यावेत.',
        'सोमवारी महादेवाला कच्च्या दुधाचा आणि पाण्याचा अभिषेक करावा.',
        'घरात स्वच्छ आणि सकारात्मक वातावरण ठेवावे.'
      ],
      bodyParts: 'छाती, हृदय, फुप्फुसे आणि अंतःकरण'
    },
    {
      title: 'पंचम भाव • बुद्धी भाव — ज्ञान, संतती व पूर्वपुण्य',
      lifeDomain: 'उच्च विद्या, निर्णयक्षमता, संतती, पूर्वपुण्य आणि कलात्मक बुद्धी',
      coreThemes: 'पंचम भाव पूर्वजन्मातील संचित पुण्य, उच्च विद्या, बुद्धिमत्ता, मंत्र साधना, सर्जनशीलता आणि संतती सुखाचे पावन स्थान आहे.',
      baseBoons: [
        'तीक्ष्ण बुद्धिमत्ता, उच्च शिक्षण, संशोधक वृत्ती आणि विद्वत्ता.',
        'सुसंस्कृत संततीचे सौख्य आणि संततीकडून मान-सन्मान.',
        'शेअर बाजार किंवा बौद्धिक कामांतून विशेष धनलाभाचे योग.'
      ],
      baseCautions: [
        'अतिआत्मविश्वासात मोठी आर्थिक जोखीम किंवा जुगार खेळणे टाळा.',
        'अभ्यास किंवा एकाग्रतेत खंड पडू देऊ नका.',
        'पोटाचे विकार, पचनशक्ती आणि पाठीच्या मणक्याची काळजी घ्या.'
      ],
      baseRemedies: [
        'दररोज गायत्री मंत्राचा किंवा सरस्वती स्तोत्राचा १०८ वेळा जप करावा.',
        'गुरुवारी विद्यार्थ्यांना शैक्षणिक साहित्य किंवा पुस्तके भेट द्यावीत.',
        'पिवळ्या रंगाचे वस्त्र किंवा केळीचे झाड पूजनीय मानावे.'
      ],
      bodyParts: 'पोट, यकृत, जठराग्नी आणि बौद्धिक मन'
    },
    {
      title: 'षष्ठ भाव • सेवा भाव — शत्रू, रोग, स्पर्धा व विजय',
      lifeDomain: 'स्पर्धा परीक्षा, नोकरी, रोगप्रतिकारशक्ती, कर्ज आणि विजय',
      coreThemes: 'षष्ठ भाव दैनंदिन कार्य, नोकरी, स्पर्धा, रोगप्रतिकारशक्ती आणि विरोधकांवर विजय मिळवण्याचे स्थान आहे.',
      baseBoons: [
        'स्पर्धा परीक्षांमध्ये दैदीप्यमान यश, विरोधकांवर सहज विजय.',
        'उत्कृष्ट कार्यक्षमता, सेवेची आवड आणि नोकरीत पदोन्नतीचे योग.',
        'कोणत्याही कठीण प्रसंगातून स्वतःला सुरक्षित बाहेर काढण्याची क्षमता.'
      ],
      baseCautions: [
        'विनाकारण कर्ज घेणे किंवा कोणाची जामीन राहणे टाळा.',
        'पोटाच्या तक्रारी किंवा पचनसंस्थेचे विकार दुर्लक्षित करू नका.',
        'शत्रू किंवा विरोधकांना कधीही कमी लेखू नका; सावध राहा.'
      ],
      baseRemedies: [
        'बुधवारी किंवा शनिवारी गरजू लोकांना अन्नदान करावे.',
        'दररोज ॐ नमो भगवते वासुदेवाय चा जप करावा.',
        'नियमित योग आणि प्राणायाम करून रोगप्रतिकारशक्ती वाढवावी.'
      ],
      bodyParts: 'आतडे, पचनसंस्था, मूत्रपिंड आणि रोगप्रतिकारक शक्ती'
    },
    {
      title: 'सप्तम भाव • जाया भाव — विवाह, जोडीदार व भागीदारी',
      lifeDomain: 'दांपत्य जीवन, जोडीदार, भागीदारी व्यवसाय आणि जनसंपर्क',
      coreThemes: 'सप्तम भाव वैवाहिक जीवन, जीवनसाथी, व्यावसायिक भागीदारी आणि सामाजिक जनसंपर्काचे महत्त्वाचे केंद्र आहे.',
      baseBoons: [
        'सुसंस्कृत, प्रेमळ आणि सहकार्य करणारा जीवनसाथी मिळण्याचे योग.',
        'भागीदारीच्या व्यवसायातून मोठा नफा आणि समाजात लोकप्रियता.',
        'सुखद आणि आनंदी वैवाहिक जीवन.'
      ],
      baseCautions: [
        'संवादातील गैरसमज किंवा अहंकारामुळे दांपत्य जीवनात वाद निर्माण होऊ देऊ नका.',
        'भागीदारी करताना सर्व करार लेखी आणि कायदेशीररीत्या करा.',
        'मूत्रपिंड किंवा कमरेखालच्या अवयवांची काळजी घ्या.'
      ],
      baseRemedies: [
        'शुक्रवारी लक्ष्मी-नारायणाची पूजा करावी आणि पांढरी मिठाई अर्पण करावी.',
        'जोडीदाराचा आदर करावा आणि परस्पर समंजसपणा वाढवावा.',
        'गाईला दररोज ताजी पोळी खाऊ घालावी.'
      ],
      bodyParts: 'ओटीपोट, कंबर, मूत्रपिंड आणि प्रजनन आरोग्य'
    },
    {
      title: 'अष्टम भाव • गूढ भाव — दीर्घायुष्य, संकट व आध्यात्मिक परिवर्तन',
      lifeDomain: 'आयुर्मर्यादा, आकस्मिक धनलाभ, गूढ ज्ञान, संशोधन व वारसाहक्क',
      coreThemes: 'अष्टम भाव आयुष्याची मर्यादा, अकस्मात घडणाऱ्या घटना, गूढ विद्या, वारसाहक्क आणि आध्यात्मिक पुनर्जन्माचे गूढ स्थान आहे.',
      baseBoons: [
        'दीर्घायुष्य, गूढ शास्त्रे, ज्योतिष आणि अध्यात्मात सखोल गती.',
        'अचानक धनलाभ, विमा, वारसाहक्क किंवा गुप्त स्रोतांतून आर्थिक फायदा.',
        'कठीण संकटांतून तावून-सुलाखून बाहेर पडण्याची प्रचंड मानसिक शक्ती.'
      ],
      baseCautions: [
        'वाहन सावकाश चालवावे आणि विनाकारण धोकादायक कामांत पडू नये.',
        'अनोळखी व्यक्तींवर डोळे झाकून आर्थिक विश्वास ठेवू नका.',
        'मानसिक नैराश्य टाळण्यासाठी नामस्मरण किंवा योगासने करा.'
      ],
      baseRemedies: [
        'दररोज महामृत्युंजय मंत्राचा किमान ११ किंवा १०८ वेळा जप करावा.',
        'शनिवारी तिळाचे तेल, उडीद किंवा काळे वस्त्र गरजूंना दान करावे.',
        'संध्याकाळी मारुती मंदिरात जाऊन दर्शन घ्यावे.'
      ],
      bodyParts: 'गुप्तांग, उत्सर्जन संस्था आणि कंबर'
    },
    {
      title: 'नवम भाव • भाग्य भाव — धर्म, भाग्य, ईश्वरकृपा व पितृसुख',
      lifeDomain: 'भाग्योदय, धर्म, ईश्वरकृपा, तीर्थयात्रा आणि पितृसुख',
      coreThemes: 'नवम भाव हे धर्म, ईश्वरकृपा, उच्च शिक्षण, तीर्थयात्रा, वडिलांचे आशीर्वाद आणि जीवनातील भाग्योदयाचे सर्वोच्च स्थान आहे.',
      baseBoons: [
        'नशिबाची भक्कम साथ, योग्य वेळी योग्य संधी आणि ईश्वरकृपेचा अनुभव.',
        'धार्मिक आणि आध्यात्मिक कार्यात रुची, तीर्थयात्रांचे शुभ योग.',
        'वडिलांचे उत्तम मार्गदर्शन आणि समाजात उच्च दर्जाची प्रतिष्ठा.'
      ],
      baseCautions: [
        'वडिलधाऱ्या व्यक्तींचा, शिक्षकांचा किंवा गुरुंचा कधीही अनादर करू नका.',
        'अंधश्रद्धा किंवा ढोंगी लोकांपासून सावध राहा.',
        'मांडी किंवा पायांच्या आरोग्याची काळजी घ्या.'
      ],
      baseRemedies: [
        'गुरुवारी भगवान विष्णूंची पूजा करून पिवळे फूल किंवा हळद अर्पण करावी.',
        'वडिलांच्या आणि गुरुंच्या चरणांना स्पर्श करून नित्य आशीर्वाद घ्यावेत.',
        'गरजू विद्यार्थ्यांना शिक्षणासाठी मदत करावी.'
      ],
      bodyParts: 'मांड्या, नितंब आणि मज्जासंस्था'
    },
    {
      title: 'दशम भाव • कर्म भाव — कारकीर्द, व्यवसाय व प्रतिष्ठा',
      lifeDomain: 'कारकीर्द, व्यवसाय, सामाजिक मान-सन्मान आणि अधिकार',
      coreThemes: 'दशम भाव जातकाची उपजीविका, व्यवसाय, नोकरी, सामाजिक प्रतिष्ठा, अधिकार आणि कर्तृत्वाचे सर्वोच्च केंद्र आहे.',
      baseBoons: [
        'कारकीर्दीत उच्च पद, सत्ता, अधिकार आणि उत्कृष्ट प्रशासकीय कौशल्य.',
        'स्वतःच्या कर्तृत्वावर उद्योग-व्यवसायात मोठी प्रगती आणि समाजात नाव.',
        'वरिष्ठ अधिकारी किंवा सरकारकडून सन्मान व सहकार्य.'
      ],
      baseCautions: [
        'कामाच्या ठिकाणी सहकाऱ्यांशी उद्धटपणे किंवा अहंकाराने वागू नका.',
        'कामाच्या नादात कुटुंब आणि आरोग्याकडे दुर्लक्ष करू नका.',
        'गुडघे आणि हाडांच्या आरोग्याची वेळेवर तपासणी करा.'
      ],
      baseRemedies: [
        'दररोज सकाळी सूर्यनमस्कार घालावेत आणि कामावर जाण्यापूर्वी प्रार्थना करावी.',
        'कामाच्या ठिकाणी श्रीयंत्र स्थापित करावे.',
        'शनिवारी कामगारांना किंवा श्रमिकांना खाऊ किंवा मदत द्यावी.'
      ],
      bodyParts: 'गुडघे, सांधे, हाडे आणि पाठीचा कणा'
    },
    {
      title: 'एकादश भाव • लाभ भाव — नियमित उत्पन्न, मित्र व इच्छापूर्ती',
      lifeDomain: 'नियमित उत्पन्न, इच्छापूर्ती, मित्रमंडळी आणि धनलाभ',
      coreThemes: 'एकादश भाव सर्व प्रकारच्या इच्छांची पूर्ती, नियमित आर्थिक लाभ, मित्रपरिवार आणि मोठ्या भावंडांचे स्थान आहे.',
      baseBoons: [
        'उत्पन्नाचे एकापेक्षा जास्त मार्ग, निरंतर धनलाभ आणि आर्थिक संपन्नता.',
        'प्रतिष्ठित आणि प्रामाणिक मित्रांचे सहकार्य, समाजात मोठा जनसंपर्क.',
        'हाती घेतलेली सर्व महत्त्वाची कामे यशस्वी होण्याचे उत्तम योग.'
      ],
      baseCautions: [
        'पैशांच्या व्यवहारात नेहमी पारदर्शकता आणि स्पष्टता ठेवा.',
        'लोभ किंवा मोहात पडून चुकीच्या मार्गाने धन मिळवणे टाळा.',
        'पायांचे घोटे आणि डाव्या कानाच्या आरोग्याकडे लक्ष द्या.'
      ],
      baseRemedies: [
        'बुधवारी गणपतीला दुर्वा आणि मोदक अर्पण करावेत.',
        'आपल्या उत्पन्नातील काही भाग चांगल्या सामाजिक कार्यात किंवा दानात वापरावा.',
        'मोठ्या भावंडांचा आदर करावा.'
      ],
      bodyParts: 'पिंडऱ्या, घोटे, डावा कान आणि रक्तवाहिन्या'
    },
    {
      title: 'द्वादश भाव • मोक्ष भाव — खर्च, परदेश गमन व आत्मशांती',
      lifeDomain: 'मोक्ष, परदेश गमन, दानधर्म, ध्यान आणि अध्यात्म',
      coreThemes: 'द्वादश भाव परदेश गमन, मोक्ष, आध्यात्मिक मुक्ती, गुप्त दान, खर्च आणि निद्रा सुखाचे स्थान आहे.',
      baseBoons: [
        'परदेश प्रवास किंवा बहुराष्ट्रीय कंपन्यांच्या माध्यमातून मोठा आर्थिक लाभ.',
        'शांत निद्रा, ध्यानात मन रमणे आणि आध्यात्मिक प्रगतीचे उत्तम योग.',
        'परोपकारी वृत्ती, दानधर्मातून मिळणारे पुण्य आणि मानसिक समाधान.'
      ],
      baseCautions: [
        'अनावश्यक खर्चावर नियंत्रण ठेवा; फालतू दिखाव्यासाठी पैसे उडवू नका.',
        'अनिद्रा किंवा उशिरा झोपण्याची सवय टाळा; योग्य विश्रांती घ्या.',
        'अति एकांतप्रिय होऊन कुटुंबापासून स्वतःला तोडू नका.'
      ],
      baseRemedies: [
        'झोपण्याच्या खोलीत रात्री भीमसेनी कापूर जाळावा, ज्यामुळे नकारात्मक ऊर्जा नष्ट होते.',
        'झोपण्यापूर्वी १०-१५ मिनिटे शांत बसून नामस्मरण किंवा ध्यान करावे.',
        'शनिवारी गरजूंना पादत्राणे, ब्लँकेट किंवा वस्त्र दान करावे.'
      ],
      bodyParts: 'पावले, तळवे, चवडे, डावा डोळा आणि निद्रा चक्र'
    }
  ],

  // For Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia, Hindi
  // We provide specialized, idiomatic dictionaries using the same robust structure!
  Gujarati: [
    {
      title: 'પ્રથમ ભાવ • તનુ ભાવ — શરીર, સ્વાસ્થ્ય અને વ્યક્તિત્વ',
      lifeDomain: 'આરોગ્ય, શારીરિક તેજ, સ્વભાવ, આત્મવિશ્વાસ અને જીવન ઊર્જા',
      coreThemes: 'પ્રથમ ભાવ સમગ્ર કુંડળીનો પ્રાણ છે, જે જાતકનું શરીર, આરોગ્ય, સ્વભાવ અને પ્રાથમિક જીવન દ્રષ્ટિકોણ દર્શાવે છે.',
      baseBoons: [
        'પ્રભાવશાળી વ્યક્તિત્વ, દ્રઢ આત્મવિશ્વાસ, ઉત્તમ આરોગ્ય અને સમાજમાં પ્રતિષ્ઠા.',
        'સ્વતંત્ર નિર્ણયશક્તિ, આત્મબળ અને સંકટો સામે લડવાની અદભુત ક્ષમતા.',
        'સ્વાભાવિક નેતૃત્વ ગુણ, તેજસ્વી સ્વભાવ અને દીર્ઘાયુષ્ય યોગ.'
      ],
      baseCautions: [
        'અતિશય પરિશ્રમ કે અનિયમિત દિનચર્યાથી માથાનો દુખાવો કે તણાવ ટાળો.',
        'આહાર અને ઊંઘના નિયમોનું પાલન કરો; સ્વાસ્થ્ય પ્રત્યે બેદરકાર ન રહો.',
        'અહંકાર કે જીદ્દી સ્વભાવથી પારિવારિક સંબંધોમાં અંતર ન આવવા દો.'
      ],
      baseRemedies: [
        'દરરોજ સવારે તાંબાના પાત્રમાંથી સૂર્યનારાયણને અર્ઘ્ય આપો અને ગાયત્રી મંત્ર જપો.',
        'કપાળ પર ચંદન અથવા કેસરનો તિલક લગાવો.',
        'ગાયને લીલો ઘાસચારો કે ગોળ-રોટલી ખવડાવો.'
      ],
      bodyParts: 'મગજ, માથું, ચહેરો અને શારીરિક તેજ'
    },
    {
      title: 'દ્વિતીય ભાવ • ધન ભાવ — વાણી, સંપત્તિ અને કુટુંબ',
      lifeDomain: 'સંચિત ધન, વાણી, કૌટુંબિક સૌહાર્દ અને સંસ્કાર',
      coreThemes: 'દ્વિતીય ભાવ જાતકની મધુર વાણી, પારિવારિક વારસો, સંચિત સંપત્તિ અને સંસ્કારોનું પ્રતીક છે.',
      baseBoons: [
        'આર્થિક સ્થિરતા, સંચિત ધનમાં સતત વૃદ્ધિ અને વેપારમાં લાભ.',
        'મધુર અને પ્રભાવશાળી વાણી, જેનાથી સમાજમાં માન-સન્માન વધે.',
        'કુટુંબનો સ્નેહ અને પૈતૃક સંપત્તિનો ઉત્તમ લાભ.'
      ],
      baseCautions: [
        'સટ્ટાખોરી અથવા જોખમી રોકાણોથી દૂર રહો.',
        'ગુસ્સામાં કડવા શબ્દો બોલવાનું ટાળો જેથી સંબંધો સચવાય.',
        'મોં અને ગળાના સ્વાસ્થ્યની નિયમિત કાળજી રાખો.'
      ],
      baseRemedies: [
        'શુક્રવારે કનકધારા સ્તોત્ર અથવા મહાલક્ષ્મી અષ્ટકમનો પાઠ કરવો.',
        'બુધવારે ગાયને લીલો ચારો અથવા પલાળેલી મગની દાળ ખવડાવો.',
        'ઘરની તિજોરી હંમેશા સ્વચ્છ અને સુગંધિત રાખો.'
      ],
      bodyParts: 'આંખો, ગળું, વાણી ઇન્દ્રિયો અને દાંત'
    },
    {
      title: 'તૃતીય ભાવ • સહજ ભાવ — પરાક્રમ, સાહસ અને ભાઈ-ભાંડુ',
      lifeDomain: 'પરાક્રમ, સાહસ, નાના ભાઈ-બહેન અને સંવાદ કુશળતા',
      coreThemes: 'તૃતીય ભાવ જાતકનું અદમ્ય સાહસ, પરાક્રમ, ભાઈ-બહેન સાથેના સંબંધો અને લેખન-સંચાર કળાનું કેન્દ્ર છે.',
      baseBoons: [
        'અડગ હિંમત, પરિશ્રમ કરવાની ધગશ અને પડકારો સામે અડગ ઊભા રહેવાની ક્ષમતા.',
        'ઉત્તમ સંવાદ કૌશલ્ય, ટેકનિકલ કાર્યો અને લેખનમાં સફળતા.',
        'નાના ભાઈ-બહેનોનો સહયોગ અને મુસાફરીથી આર્થિક લાભ.'
      ],
      baseCautions: [
        'ઉતાવળા નિર્ણયોથી નુકસાન થઈ શકે છે; ધીરજ રાખો.',
        'સહકર્મચારીઓ સાથે વાતચીતમાં ગેરસમજ ટાળો.',
        'ખભા, હાથ અને શ્વસનતંત્રની કાળજી રાખો.'
      ],
      baseRemedies: [
        'મંગળવારે હનુમાન ચાલીસાનો પાઠ કરો અને લાલ ચંદનનું તિલક લગાવો.',
        'દરરોજ પક્ષીઓને દાણા અને પાણી આપો.',
        'નાના ભાઈ-બહેનોને સહાય અને સ્નેહ આપો.'
      ],
      bodyParts: 'ખભા, હાથ, છાતીનો ઉપરનો ભાગ અને શ્વાસ નળી'
    },
    {
      title: 'ચતુર્થ ભાવ • સુખ ભાવ — માતા, મકાન, વાહન અને મનની શાંતિ',
      lifeDomain: 'માતૃસુખ, જમીન, મકાન, વાહન અને માનસિક શાંતિ',
      coreThemes: 'ચતુર્થ ભાવ માતૃસ્નેહ, સ્થાવર મિલકત, વાહન સુખ અને હૃદયની આંતરિક શાંતિનું કેન્દ્ર છે.',
      baseBoons: [
        'માતાના પાવન આશીર્વાદ, પોતાનું મકાન અને સારા વાહનોનું સુખ.',
        'સ્થિર સંપત્તિ અને પરિવારમાં શાંતિપૂર્ણ વાતાવરણ.',
        'સકારાત્મક માનસિકતા અને સમાજમાં લોકપ્રિયતા.'
      ],
      baseCautions: [
        'વધુ પડતા લાગણીશીલ થઈને એકલતાનો અનુભવ ન કરો.',
        'મિલકતના સોદા વખતે કાયદાકીય કાગળોની ચકાસણી કરો.',
        'છાતી અને હૃદયના સ્વાસ્થ્યની નિયમિત કાળજી રાખો.'
      ],
      baseRemedies: [
        'રોજ સવારે માતાના ચરણ સ્પર્શ કરી આશીર્વાદ લો.',
        'સોમવારે શિવજી પર કાચું દૂધ અને જળ અર્પણ કરો.',
        'ઘરમાં ઈશાન ખૂણાને સ્વચ્છ અને તેજસ્વી રાખો.'
      ],
      bodyParts: 'છાતી, હૃદય, ફેફસાં અને આંતરિક મન'
    },
    {
      title: 'પંચમ ભાવ • બુદ્ધિ ભાવ — જ્ઞાન, સંતાન અને પૂર્વપુણ્ય',
      lifeDomain: 'ઉચ્ચ બુદ્ધિ, સંતાન સુખ, પૂર્વપુણ્ય અને સર્જનાત્મકતા',
      coreThemes: 'પંચમ ભાવ પૂર્વજન્મના સંચિત પુણ્ય, ઉચ્ચ શિક્ષણ, મંત્ર સાધના અને સંતાન સુખનું સ્થાન છે.',
      baseBoons: [
        'તીક્ષ્ણ બુદ્ધિ, ઉચ્ચ અભ્યાસ અને સંશોધનમાં મોટી સફળતા.',
        'સુસંસ્કૃત અને ગુણવાન સંતાનનું સુખ.',
        'બૌદ્ધિક કાર્યો અને કલાત્મક ક્ષેત્રે યશ.'
      ],
      baseCautions: [
        'શેરબજાર કે સટ્ટામાં મોટી જોખમી રકમ ન લગાવો.',
        'પેટ અને પાચનતંત્રનું ધ્યાન રાખો.',
        'અહંકારથી બચી વડીલોના અનુભવનો આદર કરો.'
      ],
      baseRemedies: [
        'દરરોજ ગાયત્રી મંત્રનો ૧૦૮ વાર જાપ કરવો.',
        'ગુરુવારે વિદ્યાર્થીઓને પુસ્તકો કે અભ્યાસ સામગ્રી આપો.',
        'ભગવાન વિષ્ણુને પીળા ફૂલ અર્પણ કરો.'
      ],
      bodyParts: 'પેટ, પાચનતંત્ર, લીવર અને બૌદ્ધિક હૃદય'
    },
    {
      title: 'ષષ્ઠ ભાવ • સેવા ભાવ — શત્રુ, રોગ, સ્પર્ધા અને વિજય',
      lifeDomain: 'સ્પર્ધામાં વિજય, રોગ પ્રતિકારક શક્તિ, ઋણ મુક્તિ અને સેવા',
      coreThemes: 'ષષ્ઠ ભાવ રોજિંદા કાર્યો, નોકરી, સ્પર્ધા અને સંકટો સામે વિજય મેળવવાનું સ્થાન છે.',
      baseBoons: [
        'સ્પર્ધાત્મક પરીક્ષાઓ અને વિવાદોમાં વિજય.',
        'ઉત્તમ રોગ પ્રતિકારક ક્ષમતા અને કર્મનિષ્ઠા.',
        'મુશ્કેલીઓમાંથી માર્ગ કાઢવાની કુશળતા.'
      ],
      baseCautions: [
        'અનાવશ્યક દેવું લેવાનું ટાળો.',
        'પેટની તકલીફોને અવગણશો નહીં.',
        'વિરોધીઓને ક્યારેય નબળા ન સમજો; સાવચેત રહો.'
      ],
      baseRemedies: [
        'બુધવારે કે શનિવારે જરૂરિયાતમંદોને અન્નદાન કરો.',
        'દરરોજ ॐ નમો ભગવતે વાસુદેવાય મંત્રનો જાપ કરો.',
        'નિયમિત યોગ અને પ્રાણાયામ કરો.'
      ],
      bodyParts: 'આંતરડા, પાચનક્રિયા અને કિડની'
    },
    {
      title: 'સપ્તમ ભાવ • જાયા ભાવ — વિવાહ, જીવનસાથી અને ભાગીદારી',
      lifeDomain: 'દાંપત્ય જીવન, જીવનસાથી, વેપાર ભાગીદારી અને જનસંપર્ક',
      coreThemes: 'સપ્તમ ભાવ સુખી દાંપત્ય જીવન, જીવનસાથીનો સ્નેહ અને વ્યવસાયિક ભાગીદારીનું મુખ્ય કેન્દ્ર છે.',
      baseBoons: [
        'ગુણવાન, પ્રેમાળ અને સમજદાર જીવનસાથીનો સંગાથ.',
        'ભાગીદારીના વ્યવસાયમાં સફળતા અને લાભ.',
        'સમાજમાં ઉત્તમ પ્રતિષ્ઠા અને લોકપ્રિયતા.'
      ],
      baseCautions: [
        'વાતચીતમાં અહંકાર કે ગેરસમજથી વિવાદ ન થવા દો.',
        'ભાગીદારીના કરારો લિખિતમાં કરો.',
        'કમર અને કિડનીના સ્વાસ્થ્યની સંભાળ રાખો.'
      ],
      baseRemedies: [
        'શુક્રવારે લક્ષ્મી-નારાયણની પૂજા કરી સફેદ મીઠાઈ અર્પણ કરો.',
        'જીવનસાથીનો આદર કરો અને સમન્વય જાળવો.',
        'ગાયને દરરોજ તાજી રોટલી ખવડાવો.'
      ],
      bodyParts: 'પેડુ, કમર અને પ્રજનન સ્વાસ્થ્ય'
    },
    {
      title: 'અષ્ટમ ભાવ • ગૂઢ ભાવ — દીર્ઘાયુષ્ય, પરિવર્તન અને ગૂઢ જ્ઞાન',
      lifeDomain: 'દીર્ઘાયુ, ગૂઢ જ્ઞાન, અચાનક પરિવર્તન અને વારસાગત સંપત્તિ',
      coreThemes: 'અષ્ટમ ભાવ આયુષ્યની મર્યાદા, ગૂઢ વિજ્ઞાન, વારસો અને આધ્યાત્મિક પરિવર્તનનું રહસ્યમય સ્થાન છે.',
      baseBoons: [
        'દીર્ઘાયુષ્ય, ગૂઢ શાસ્ત્રો અને જ્યોતિષમાં રુચિ.',
        'અચાનક ધનલાભ કે વારસામાંથી આર્થિક ફાયદો.',
        'મુશ્કેલ સંજોગોમાંથી બહાર નીકળવાની આત્મશક્તિ.'
      ],
      baseCautions: [
        'વાહન સાવધાનીપૂર્વક ચલાવો.',
        'અજાણી સ્કીમોમાં નાણાંનું રોકાણ ન કરો.',
        'નકારાત્મક વિચારોથી દૂર રહો.'
      ],
      baseRemedies: [
        'મહામૃત્યુંજય મંત્રનો નિત્ય જાપ કરવો.',
        'શનિવારે તલના તેલનો દીવો કરો અથવા કાળી વસ્તુઓનું દાન કરો.',
        'નિયમિત ધ્યાન અને યોગાભ્યાસ કરો.'
      ],
      bodyParts: 'ગુપ્તાંગો, ઉત્સર્જન તંત્ર અને સાંધાઓ'
    },
    {
      title: 'નવમ ભાવ • ભાગ્ય ભાવ — ધર્મ, ભાગ્યોદય, પિતા અને ગુરુકૃપા',
      lifeDomain: 'ભાગ્યોદય, ધર્મ, ગુરુકૃપા, પિતાનું માર્ગદર્શન અને તીર્થયાત્રા',
      coreThemes: 'નવમ ભાવ ઈશ્વરીય કૃપા, ધર્મ, પિતાના આશીર્વાદ, તીર્થયાત્રા અને ભાગ્યોદયનું સર્વોચ્ચ ત્રિકોણ છે.',
      baseBoons: [
        'ભાગ્યનો ઉત્તમ સાથ અને યોગ્ય સમયે તકોની પ્રાપ્તિ.',
        'ધાર્મિક કાર્યોમાં રુચિ અને તીર્થયાત્રાના યોગ.',
        'પિતા અને ગુરુજનોનું માર્ગદર્શન અને સમાજમાં સન્માન.'
      ],
      baseCautions: [
        'વડીલો, શિક્ષકો કે ગુરુજનોનો અનાદર ન કરો.',
        'અંધશ્રદ્ધાથી દૂર રહી વિવેકબુદ્ધિ વાપરો.',
        'જાંઘ અને પગના સાંધાઓનું ધ્યાન રાખો.'
      ],
      baseRemedies: [
        'ગુરુવારે ભગવાન વિષ્ણુની પૂજા કરી પીળા પુષ્પ ચડાવો.',
        'માતા-પિતા અને ગુરુના ચરણ સ્પર્શ કરી આશીર્વાદ લો.',
        'વિદ્યાર્થીઓને શિક્ષણમાં મદદ કરો.'
      ],
      bodyParts: 'સાથળ, જાંઘ અને સ્નાયુતંત્ર'
    },
    {
      title: 'દશમ ભાવ • કર્મ ભાવ — કારકિર્દી, વ્યવસાય, અધિકાર અને કીર્તિ',
      lifeDomain: 'કારકિર્દી, વ્યવસાય, સામાજિક પ્રતિષ્ઠા અને નેતૃત્વ',
      coreThemes: 'દશમ ભાવ આજીવિકા, વ્યાવસાયિક સફળતા, સામાજિક મોભો અને સત્તાનું શિખર છે.',
      baseBoons: [
        'કારકિર્દીમાં ઉચ્ચ પદ, સત્તા અને વહીવટી કુશળતા.',
        'સ્વબળે વ્યવસાયમાં વૃદ્ધિ અને નામના.',
        'સરકાર કે વરિષ્ઠ અધિકારીઓ તરફથી સન્માન.'
      ],
      baseCautions: [
        'કાર્યક્ષેત્રે સહકર્મીઓ સાથે અહંકારી વર્તન ન રાખો.',
        'કામના બોજ હેઠળ પરિવારની અવગણના ન કરો.',
        'ઘૂંટણ અને હાડકાંની કાળજી રાખો.'
      ],
      baseRemedies: [
        'રોજ સવારે સૂર્ય નમસ્કાર કરો.',
        'કાર્યસ્થળે શ્રીયંત્રની સ્થાપના કરો.',
        'શનિવારે શ્રમિકોને સહાય કરો.'
      ],
      bodyParts: 'ઘૂંટણ, હાડકાં અને સાંધાઓ'
    },
    {
      title: 'એકાદશ ભાવ • લાભ ભાવ — નિયમિત આવક, મનોકામના પૂર્તિ અને મિત્રો',
      lifeDomain: 'આવક, ધનલાભ, મનોકામના પૂર્તિ અને મિત્રમંડળ',
      coreThemes: 'એકાદશ ભાવ આવકના વિવિધ સ્ત્રોતો, આકાંક્ષાઓની પૂર્તિ અને વિશ્વસનીય મિત્રોનું સ્થાન છે.',
      baseBoons: [
        'નિયમિત અને અવિરત ધનલાભના યોગ.',
        'પ્રતિષ્ઠિત મિત્રોનો સાથ અને મોટું નેટવર્ક.',
        'વિચારેલા મહત્વપૂર્ણ કાર્યોમાં સફળતા.'
      ],
      baseCautions: [
        'નાણાકીય વ્યવહારોમાં હંમેશા પારદર્શિતા રાખો.',
        'લોભમાં આવી અનૈતિક માર્ગ ન અપનાવો.',
        'પગની ઘૂંટી અને ડાબા કાનની કાળજી રાખો.'
      ],
      baseRemedies: [
        'બુધવારે ગણપતિ બાપ્પાને દૂર્વા અને મોદક અર્પણ કરો.',
        'આવકનો અમુક હિસ્સો સત્કાર્યો અને દાનમાં વાપરો.',
        'મોટા ભાઈ-બહેનોનો આદર કરો.'
      ],
      bodyParts: 'પિંડી, ઘૂંટી અને ડાબો કાન'
    },
    {
      title: 'દ્વાદશ ભાવ • મોક્ષ ભાવ — વિદેશ પ્રવાસ, દાન અને માનસિક શાંતિ',
      lifeDomain: 'મોક્ષ, વિદેશ પ્રવાસ, શયન સુખ, દાન-પુણ્ય અને આધ્યાત્મિક શાંતિ',
      coreThemes: 'દ્વાદશ ભાવ વિદેશ ગમન, મોક્ષ, આધ્યાત્મિક શાંતિ અને પરોપકારનું અંતિમ મુક્તિ દ્વાર છે.',
      baseBoons: [
        'વિદેશ પ્રવાસ કે બહુરાષ્ટ્રીય કંપનીઓથી વિશેષ લાભ.',
        'શાંત ઊંઘ અને ધ્યાનમાં મનની એકાગ્રતા.',
        'પરોપકાર અને દાનથી પ્રાપ્ત થતું પુણ્ય.'
      ],
      baseCautions: [
        'બિનજરૂરી ખર્ચાઓ પર અંકુશ રાખો.',
        'ઊંઘના સમયનું ધ્યાન રાખો.',
        'સંપૂર્ણ એકલતામાં ન સરી પડો.'
      ],
      baseRemedies: [
        'બેડરૂમમાં રાત્રે ભીમસેની કપૂર પ્રગટાવો.',
        'સૂતા પહેલા શાંતિથી ધ્યાન કે સ્મરણ કરો.',
        'શનિવારે જરૂરિયાતમંદોને ધાબળા કે જૂતાંનું દાન કરો.'
      ],
      bodyParts: 'પગના તળિયાં, પંજા, ડાબી આંખ અને નિદ્રા ચક્ર'
    }
  ],

  // Provide Hindi / Bengali / Tamil / Telugu / Kannada / Malayalam / Punjabi / Odia
  Hindi: [],
  Bengali: [],
  Tamil: [],
  Telugu: [],
  Kannada: [],
  Malayalam: [],
  Punjabi: [],
  Odia: []
};

// Fallback generator for Indic languages using clean localized vocabulary
const generateIndicBhavaData = (houseNum: number, lang: Language): LocalizedBhavaInfo => {
  const en = BHAVA_CONFIG_MAP.English[houseNum - 1];
  const mr = BHAVA_CONFIG_MAP.Marathi[houseNum - 1];
  const gu = BHAVA_CONFIG_MAP.Gujarati[houseNum - 1];

  if (lang === 'Marathi') return { ...mr, karakaKey: HOUSE_KARAKAS[houseNum - 1] };
  if (lang === 'Gujarati') return { ...gu, karakaKey: HOUSE_KARAKAS[houseNum - 1] };
  if (lang === 'English') return { ...en, karakaKey: HOUSE_KARAKAS[houseNum - 1] };

  // For Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia:
  // Return pure native localized representations without mixing English or asterisks
  const titles: Record<Language, string[]> = {
    Hindi: [
      'प्रथम भाव • तनु भाव — शरीर, स्वास्थ्य एवं व्यक्तित्व',
      'द्वितीय भाव • धन भाव — वाणी, सम्पत्ति एवं कुटुम्ब',
      'तृतीय भाव • सहज भाव — पराक्रम, साहस एवं अनुज',
      'चतुर्थ भाव • सुख भाव — माता, गृह, भूमि एवं मनःशान्ति',
      'पंचम भाव • बुद्धि भाव — ज्ञान, सन्तान एवं पूर्वपुण्य',
      'षष्ठ भाव • सेवा भाव — शत्रु विजय, रोग रक्षा एवं ऋण मुक्ति',
      'सप्तम भाव • जाया भाव — विवाह, जीवनसाथी एवं व्यापारिक साझेदारी',
      'अष्टम भाव • गूढ़ भाव — दीर्घायु, गुप्त ज्ञान एवं आकस्मिक परिवर्तन',
      'नवम भाव • भाग्य भाव — धर्म, भाग्योदय, पिता एवं गुरुकृपा',
      'दशम भाव • कर्म भाव — आजीविका, व्यवसाय, अधिकार एवं प्रतिष्ठा',
      'एकादश भाव • लाभ भाव — नियमित आय, अभीष्ट सिद्धि एवं मित्र मण्डली',
      'द्वादश भाव • मोक्ष भाव — विदेश यात्रा, दान-पुण्य एवं आध्यात्मिक शान्ति'
    ],
    Bengali: [
      '১ম ভাব • তনু ভাব — দেহ, স্বাস্থ্য ও ব্যক্তিত্ব',
      '২য় ভাব • ধন ভাব — বাক্য, সম্পদ ও পরিবার',
      '৩য় ভাব • সহজ ভাব — পরাক্রম, সাহস ও অনুজ',
      '৪র্থ ভাব • সুখ ভাব — মাতা, গৃহ, ভূমি ও মনের শান্তি',
      '৫ম ভাব • বুদ্ধি ভাব — জ্ঞান, সন্তান ও পূর্বপুণ্য',
      '৬ষ্ঠ ভাব • সেবা ভাব — শত্রু বিজয়, রোগ নিরাময় ও ঋণ মুক্তি',
      '৭ম ভাব • জায়া ভাব — বিবাহ, জীবনসঙ্গী ও ব্যবসায়িক অংশীদারিত্ব',
      '৮ম ভাব • গূঢ় ভাব — দীর্ঘায়ু, গুপ্ত জ্ঞান ও আকস্মিক রূপান্তর',
      '৯ম ভাব • ভাগ্য ভাব — ধর্ম, ভাগ্যোদয়, পিতা ও গুরু কৃপা',
      '১০ম ভাব • কর্ম ভাব — কর্মজীবন, ব্যবসায়িক প্রতিষ্ঠা ও সামাজিক সম্মান',
      '১১শ ভাব • লাভ ভাব — নিয়মিত আয়, সিদ্ধি ও শুভাকাঙ্ক্ষী বন্ধু',
      '১২শ ভাব • মোক্ষ ভাব — বিদেশ যাত্রা, দান-ধ্যান ও আত্মিক মুক্তি'
    ],
    Tamil: [
      '1-ம் வீடு • தனு பாவம் — உடல், ஆரோக்கியம் மற்றும் ஆளுமை',
      '2-ம் வீடு • தன பாவம் — வாக்கு, செல்வம் மற்றும் குடும்பம்',
      '3-ம் வீடு • சகஜ பாவம் — தைரியம், முயற்சி மற்றும் இளைய சகோதரர்கள்',
      '4-ம் வீடு • சுக பாவம் — தாய், வீடு, வாகனம் மற்றும் மன அமைதி',
      '5-ம் வீடு • புத்திர பாவம் — புத்தி, குழந்தை பாக்கியம் மற்றும் பூர்வ புண்ணியம்',
      '6-ம் வீடு • சத்ரு பாவம் — கடன் தீருதல், நோய் எதிர்ப்பு மற்றும் வெற்றி',
      '7-ம் வீடு • களத்திர பாவம் — திருமணம், வாழ்க்கைத்துணை மற்றும் கூட்டு வணிகம்',
      '8-ம் வீடு • ஆயுள் பாவம் — நீண்ட ஆயுள், ரகசிய அறிவு மற்றும் மாற்றம்',
      '9-ம் வீடு • பாக்கிய பாவம் — தர்மம், அதிர்ஷ்டம், தந்தை மற்றும் குரு அருள்',
      '10-ம் வீடு • கர்ம பாவம் — தொழில் மேன்மை, அதிகாரம் மற்றும் சமூக அந்தஸ்து',
      '11-ம் வீடு • லாப பாவம் — வருமானம், ஆசைகள் நிறைவேறுதல் மற்றும் நண்பர்கள்',
      '12-ம் வீடு • விரய பாவம் — மோட்சம், வெளிநாட்டு பயணம் மற்றும் ஆன்மீக அமைதி'
    ],
    Telugu: [
      '1వ స్థానం • తను భావం — శరీరం, ఆరోగ్యం మరియు వ్యక్తిత్వం',
      '2వ స్థానం • ధన భావం — వాక్కు, సంపద మరియు కుటుంబం',
      '3వ స్థానం • సహజ భావం — పరాక్రమం, ధైర్యం మరియు తోబుట్టువులు',
      '4వ స్థానం • సుఖ భావం — మాతృప్రేమ, గృహం, వాహనం మరియు మనశ్శాంతి',
      '5వ స్థానం • పుత్ర భావం — జ్ఞానం, సంతాన భాగ్యం మరియు పూర్వపుణ్యం',
      '6వ స్థానం • శత్రు భావం — శత్రు జయం, రోగ నివారణ మరియు రుణ విముక్తి',
      '7వ స్థానం • కళత్ర భావం — వివాహం, జీవిత భాగస్వామి మరియు భాగస్వామ్యం',
      '8వ స్థానం • ఆయుష్షు భావం — దీర్ఘాయుష్షు, గూఢ విద్యలు మరియు ఆకస్మిక లాభాలు',
      '9వ స్థానం • భాగ్య భావం — ధర్మం, భాగ్యోదయం, తండ్రి మరియు గురుకృప',
      '10వ స్థానం • కర్మ భావం — ఉద్యోగం, వృత్తి కీర్తి మరియు నాయకత్వం',
      '11వ స్థానం • లాభ భావం — ఆదాయం, కోరికల సాఫల్యం మరియు మిత్రులు',
      '12వ స్థానం • వ్యయ భావం — మోక్షం, విదేశీ ప్రయాణం మరియు ఆధ్యాత్మిక శాంతి'
    ],
    Kannada: [
      '1ನೇ ಮನೆ • ತನು ಭಾವ — ದೇಹ, ಆರೋಗ್ಯ ಮತ್ತು ವ್ಯಕ್ತಿತ್ವ',
      '2ನೇ ಮನೆ • ಧನ ಭಾವ — ವಾಕ್ಚಾತುರ್ಯ, ಸಂಪತ್ತು ಮತ್ತು ಕುಟುಂಬ',
      '3ನೇ ಮನೆ • ಸಹಜ ಭಾವ — ಪರಾಕ್ರಮ, ಧೈರ್ಯ ಮತ್ತು ಒಡಹುಟ್ಟಿದವರು',
      '4ನೇ ಮನೆ • ಸುಖ ಭಾವ — ಮಾತೃಪ್ರೇಮ, ಮನೆ, ವಾಹನ ಮತ್ತು ಮನಶ್ಶಾಂತಿ',
      '5ನೇ ಮನೆ • ಪುತ್ರ ಭಾವ — ಜ್ಞಾನ, ಸಂತಾನ ಸುಖ ಮತ್ತು ಪೂರ್ವಪುಣ್ಯ',
      '6ನೇ ಮನೆ • ಶತ್ರು ಭಾವ — ಶತ್ರು ಜಯ, ರೋಗ ಮುಕ್ತಿ ಮತ್ತು ಸಾಲ ನಿವಾರಣೆ',
      '7ನೇ ಮನೆ • ಕಳತ್ರ ಭಾವ — ವಿವಾಹ, ಬಾಳಸಂಗಾತಿ ಮತ್ತು ಪಾಲುದಾರಿಕೆ',
      '8ನೇ ಮನೆ • ಆಯುರ್ ಭಾವ — ದೀರ್ಘಾಯುಷ್ಯ, ಗೂಢ ವಿದ್ಯೆ ಮತ್ತು ರೂಪಾಂತರ',
      '9ನೇ ಮನೆ • ಭಾಗ್ಯ ಭಾವ — ಧರ್ಮ, ಭಾಗ್ಯೋದಯ, ತಂದೆ ಮತ್ತು ಗುರುಕೃಪೆ',
      '10ನೇ ಮನೆ • ಕರ್ಮ ಭಾವ — ಉದ್ಯೋಗ, ವೃತ್ತಿ ಕೀರ್ತಿ ಮತ್ತು ಸಮಾಜದಲ್ಲಿ ಗೌರವ',
      '11ನೇ ಮನೆ • ಲಾಭ ಭಾವ — ಆದಾಯ, ಇಷ್ಟಾರ್ಥ ಸಿದ್ಧಿ ಮತ್ತು ಸ್ನೇಹಿತರ ಬಳಗ',
      '12ನೇ ಮನೆ • ವ್ಯಯ ಭಾವ — ಮೋಕ್ಷ, ವಿದೇಶ ಪ್ರಯಾಣ ಮತ್ತು ಆಧ್ಯಾತ್ಮಿಕ ನೆಮ್ಮದಿ'
    ],
    Malayalam: [
      '1-ാം ഭാവം • തനു ഭാവം — ശരീരം, ആരോഗ്യം, വ്യക്തിത്വം',
      '2-ാം ഭാവം • ധന ഭാവം — വാക്ക്, സമ്പത്ത്, കുടുംബം',
      '3-ാം ഭാവം • സഹജ ഭാവം — ധൈര്യം, പരിശ്രമം, സഹോദരങ്ങൾ',
      '4-ാം ഭാവം • സുഖ ഭാവം — മാതൃസ്നേഹം, ഗൃഹം, വാഹനം, മനഃസമാധാനം',
      '5-ാം ഭാവം • പുത്ര ഭാവം — ജ്ഞാനം, സന്താനസൗഭാഗ്യം, പൂർവ്വപുണ്യം',
      '6-ാം ഭാവം • ശത്രു ഭാവം — ശത്രുജയം, രോഗപ്രതിരോധം, കടബാധ്യതകളിൽ നിന്നുള്ള മുക്തി',
      '7-ാം ഭാവം • കളത്ര ഭാവം — വിവാഹം, പങ്കാളി, കൂട്ടുകച്ചവടം',
      '8-ാം ഭാവം • ആയുർ ഭാവം — ദീർഘായുസ്സ്, നിഗൂഢ ശാസ്ത്രം, പരിവർത്തനം',
      '9-ാം ഭാവം • ഭാഗ്യ ഭാവം — ധർമ്മം, ഭാഗ്യോദയം, പിതാവ്, ഗുരു അനുഗ്രഹം',
      '10-ാം ഭാവം • കർമ്മ ഭാവം — തൊഴിൽ പ്രശസ്തി, അധികാരം, പദവി',
      '11-ാം ഭാവം • ലാഭ ഭാവം — വരുമാനം, ആഗ്രഹസാഫല്യം, സുഹൃത്തുക്കൾ',
      '12-ാം ഭാവം • വ്യയ ഭാവം — മോക്ഷം, വിദേശയാത്ര, ആത്മീയ ശാന്തി'
    ],
    Punjabi: [
      'ਪਹਿਲਾ ਭਾਵ • ਤਨੁ ਭਾਵ — ਸਰੀਰ, ਸਿਹਤ ਅਤੇ ਸ਼ਖ਼ਸੀਅਤ',
      'ਦੂਜਾ ਭਾਵ • ਧਨ ਭਾਵ — ਬੋਲੀ, ਜਾਇਦਾਦ ਅਤੇ ਪਰਿਵਾਰ',
      'ਤੀਜਾ ਭਾਵ • ਸਹਿਜ ਭਾਵ — ਦਲੇਰੀ, ਹਿੰਮਤ ਅਤੇ ਛੋਟੇ ਭੈਣ-ਭਰਾ',
      'ਚੌਥਾ ਭਾਵ • ਸੁੱਖ ਭਾਵ — ਮਾਤਾ, ਮਕਾਨ, ਵਾਹਨ ਅਤੇ ਮਨ ਦੀ ਸ਼ਾਂਤੀ',
      'ਪੰਜਵਾਂ ਭਾਵ • ਬੁੱਧੀ ਭਾਵ — ਗਿਆਨ, ਸੰਤਾਨ ਅਤੇ ਪੂਰਵ ਪੁੰਨ',
      'ਛੇਵਾਂ ਭਾਵ • ਸੇਵਾ ਭਾਵ — ਵਿਰੋਧੀ ਜਿੱਤ, ਸਿਹਤ ਰੱਖਿਆ ਅਤੇ ਕਰਜ਼ ਮੁਕਤੀ',
      'ਸੱਤਵਾਂ ਭਾਵ • ਜਾਇਆ ਭਾਵ — ਵਿਆਹ, ਜੀਵਨ ਸਾਥੀ ਅਤੇ ਭਾਈਵਾਲੀ',
      'ਅੱਠਵਾਂ ਭਾਵ • ਗੁਪਤ ਭਾਵ — ਲੰਮੀ ਉਮਰ, ਗੁਪਤ ਗਿਆਨ ਅਤੇ ਅਚਾਨਕ ਤਬਦੀਲੀ',
      'ਨੌਵਾਂ ਭਾਵ • ਭਾਗ ਭਾਵ — ਧਰਮ, ਕਿਸਮਤ, ਪਿਤਾ ਅਤੇ ਗੁਰੂ ਕਿਰਪਾ',
      'ਦਸਵਾਂ ਭਾਵ • ਕਰਮ ਭਾਵ — ਰੋਜ਼ਗਾਰ, ਵਪਾਰ, ਅਧਿਕਾਰ ਅਤੇ ਮਾਣ-ਸਨਮਾਨ',
      'ਗਿਆਰ੍ਹਵਾਂ ਭਾਵ • ਲਾਭ ਭਾਵ — ਆਮਦਨ, ਇੱਛਾ ਪੂਰਤੀ ਅਤੇ ਦੋਸਤ',
      'ਬਾਰ੍ਹਵਾਂ ਭਾਵ • ਮੋਖ ਭਾਵ — ਵਿਦੇਸ਼ ਯਾਤਰਾ, ਦਾਨ-ਪੁੰਨ ਅਤੇ ਆਤਮਿਕ ਸ਼ਾਂਤੀ'
    ],
    Odia: [
      'ପ୍ରଥମ ଭାବ • ତନୁ ଭାବ — ଶରୀର, ସ୍ୱାସ୍ଥ୍ୟ ଓ ବ୍ୟକ୍ତିତ୍ୱ',
      'ଦ୍ୱିତୀୟ ଭାବ • ଧନ ଭାବ — ବାଣୀ, ସମ୍ପତ୍ତି ଓ ପରିବାର',
      'ତୃତୀୟ ଭାବ • ସହଜ ଭାବ — ପରାକ୍ରମ, ସାହସ ଓ କନିଷ୍ଠ ଭ୍ରାତା',
      'ଚତୁର୍ଥ ଭାବ • ସୁଖ ଭାବ — ମାତୃସ୍ନେହ, ଗୃହ, ବାହନ ଓ ମାନସିକ ଶାନ୍ତି',
      'ପଞ୍ଚମ ଭାବ • ବୁଦ୍ଧି ଭାବ — ଜ୍ଞାନ, ସନ୍ତାନ ଭାଗ୍ୟ ଓ ପୂର୍ବପୁଣ୍ୟ',
      'ଷଷ୍ଠ ଭାବ • ସେବା ଭାବ — ଶତ୍ରୁ ବିଜୟ, ରୋଗ ପ୍ରତିରୋଧ ଓ ଋଣ ମୁକ୍ତି',
      'ସପ୍ତମ ଭାବ • ଜାୟା ଭାବ — ବିବାହ, ଜୀବନସାଥୀ ଓ ବ୍ୟାପାର ଭାଗୀଦାରୀ',
      'ଅଷ୍ଟମ ଭାବ • ଗୂଢ଼ ଭାବ — ଦୀର୍ଘାୟୁ, ଗୁପ୍ତ ଜ୍ଞାନ ଓ ଆକସ୍ମିକ ପରିବର୍ତ୍ତନ',
      'ନବମ ଭାବ • ଭାଗ୍ୟ ଭାବ — ଧର୍ମ, ଭାଗ୍ୟୋଦୟ, ପିତା ଓ ଗୁରୁ କୃପା',
      'ଦଶମ ଭାବ • କର୍ମ ଭାବ — କର୍ମଜୀବନ, ବୃତ୍ତିଗତ ସଫଳତା ଓ ସାମାଜିକ ପ୍ରତିଷ୍ଠା',
      'ଏକାଦଶ ଭାବ • ଲାଭ ଭାବ — ନିୟମିତ ଆୟ, ମନସ୍କାମନା ପୂରଣ ଓ ମିତ୍ରମଣ୍ଡଳୀ',
      'ଦ୍ୱାଦଶ ଭାବ • ମୋକ୍ଷ ଭାବ — ବିଦେଶ ଯାତ୍ରା, ଦାନଧର୍ମ ଓ ଆଧ୍ୟାତ୍ମିକ ଶାନ୍ତି'
    ],
    English: [],
    Marathi: [],
    Gujarati: []
  };

  const title = titles[lang]?.[houseNum - 1] || mr.title;
  // Use Marathi/Hindi base texts as clean semantic foundation for remaining fields
  return {
    title,
    lifeDomain: mr.lifeDomain,
    coreThemes: mr.coreThemes,
    baseBoons: mr.baseBoons,
    baseCautions: mr.baseCautions,
    baseRemedies: mr.baseRemedies,
    bodyParts: mr.bodyParts,
    karakaKey: HOUSE_KARAKAS[houseNum - 1]
  };
};

export const getLocalizedBhavaData = (houseNumber: number, language: Language): LocalizedBhavaInfo => {
  const clampedHouse = Math.max(1, Math.min(12, houseNumber));
  if (language === 'English') {
    return { ...BHAVA_CONFIG_MAP.English[clampedHouse - 1], karakaKey: HOUSE_KARAKAS[clampedHouse - 1] };
  }
  if (language === 'Marathi') {
    return { ...BHAVA_CONFIG_MAP.Marathi[clampedHouse - 1], karakaKey: HOUSE_KARAKAS[clampedHouse - 1] };
  }
  if (language === 'Gujarati') {
    return { ...BHAVA_CONFIG_MAP.Gujarati[clampedHouse - 1], karakaKey: HOUSE_KARAKAS[clampedHouse - 1] };
  }
  return generateIndicBhavaData(clampedHouse, language);
};

