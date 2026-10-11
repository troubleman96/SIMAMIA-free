export interface WorkflowField {
  key: string;
  label: string;
  labelSw: string;
  placeholder: string;
  placeholderSw: string;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  optionsSw?: string[];
}

export interface BusinessTemplate {
  id: string;
  name: string;
  nameSw: string;
  description: string;
  descriptionSw: string;
  entitySingular: string;
  entitySingularSw: string;
  entityPlural: string;
  entityPluralSw: string;
  statuses: string[];
  statusLabelsSw: Record<string, string>;
  details: WorkflowField[];
  sampleServices: string[];
  sampleServicesSw: string[];
  modules: string[];
}

export const businessTemplates: BusinessTemplate[] = [
  {
    id: 'general',
    name: 'General service business',
    nameSw: 'Biashara ya huduma kwa jumla',
    description:
      'A flexible customer, service and job workflow for businesses that do not need a specialist setup.',
    descriptionSw:
      'Mtiririko unaobadilika wa wateja, huduma na kazi kwa biashara zisizohitaji mpangilio maalum.',
    entitySingular: 'Job',
    entitySingularSw: 'Kazi',
    entityPlural: 'Jobs',
    entityPluralSw: 'Kazi',
    statuses: ['New', 'In progress', 'Ready', 'Completed', 'Cancelled'],
    statusLabelsSw: {
      New: 'Jipya',
      'In progress': 'Inaendelea',
      Ready: 'Tayari',
      Completed: 'Imekamilika',
      Cancelled: 'Imeghairiwa'
    },
    details: [],
    sampleServices: ['General service', 'Consultation', 'Call-out'],
    sampleServicesSw: ['Huduma ya jumla', 'Ushauri', 'Huduma ya eneo la mteja'],
    modules: ['Customers', 'Services', 'Jobs', 'Payments', 'Expenses', 'Invoices', 'Reports']
  },
  {
    id: 'salon',
    name: 'Salon & barber',
    nameSw: 'Saluni na kinyozi',
    description:
      'Bookings and walk-ins, stylist assignments, service timing, deposits and repeat-visit history.',
    descriptionSw:
      'Miadi na wateja wa moja kwa moja, mgawo wa mtaalamu, muda wa huduma, amana na historia ya wateja.',
    entitySingular: 'Appointment',
    entitySingularSw: 'Miadi',
    entityPlural: 'Appointments',
    entityPluralSw: 'Miadi',
    statuses: [
      'Booked',
      'Checked in',
      'In service',
      'Ready for checkout',
      'Completed',
      'No-show',
      'Cancelled'
    ],
    statusLabelsSw: {
      Booked: 'Imewekewa miadi',
      'Checked in': 'Mteja amewasili',
      'In service': 'Huduma inaendelea',
      'Ready for checkout': 'Tayari kulipia',
      Completed: 'Imekamilika',
      'No-show': 'Hakufika',
      Cancelled: 'Imeghairiwa'
    },
    details: [
      {
        key: 'stylist',
        label: 'Stylist / barber',
        labelSw: 'Mtaalamu / kinyozi',
        placeholder: 'Assigned staff member',
        placeholderSw: 'Mfanyakazi aliyepangiwa'
      },
      {
        key: 'chair',
        label: 'Chair / station',
        labelSw: 'Kiti / kituo',
        placeholder: 'Chair or station',
        placeholderSw: 'Kiti au kituo'
      },
      {
        key: 'durationMinutes',
        label: 'Duration (minutes)',
        labelSw: 'Muda (dakika)',
        placeholder: '45',
        placeholderSw: '45',
        type: 'number'
      }
    ],
    sampleServices: ['Haircut', 'Wash & set', 'Braids', 'Nails'],
    sampleServicesSw: ['Kukata nywele', 'Kuosha na kupanga', 'Kusuka', 'Kucha'],
    modules: [
      'Bookings',
      'Walk-in queue',
      'Staff attribution',
      'Deposits',
      'Repeat reminders',
      'Daily close-out'
    ]
  },
  {
    id: 'garage',
    name: 'Garage & auto service',
    nameSw: 'Gereji na huduma za magari',
    description:
      'Vehicle intake, inspection, estimate approval, parts and labour, repair status and service reminders.',
    descriptionSw:
      'Mapokezi ya gari, ukaguzi, idhini ya makadirio, vipuri na kazi, hali ya matengenezo na vikumbusho.',
    entitySingular: 'Job card',
    entitySingularSw: 'Kadi ya kazi',
    entityPlural: 'Job cards',
    entityPluralSw: 'Kadi za kazi',
    statuses: [
      'Received',
      'Inspection',
      'Estimate pending',
      'Approved',
      'In repair',
      'Quality check',
      'Ready',
      'Collected',
      'On hold'
    ],
    statusLabelsSw: {
      Received: 'Imepokelewa',
      Inspection: 'Ukaguzi',
      'Estimate pending': 'Makadirio yanasubiri',
      Approved: 'Imeidhinishwa',
      'In repair': 'Matengenezo yanaendelea',
      'Quality check': 'Ukaguzi wa ubora',
      Ready: 'Tayari',
      Collected: 'Imechukuliwa',
      'On hold': 'Imesitishwa'
    },
    details: [
      {
        key: 'vehicleRegistration',
        label: 'Registration number',
        labelSw: 'Namba ya usajili',
        placeholder: 'T 123 ABC',
        placeholderSw: 'T 123 ABC'
      },
      {
        key: 'odometer',
        label: 'Odometer (km)',
        labelSw: 'Kilomita za gari',
        placeholder: 'Mileage',
        placeholderSw: 'Kilomita',
        type: 'number'
      },
      {
        key: 'complaint',
        label: 'Customer complaint',
        labelSw: 'Tatizo lililoripotiwa',
        placeholder: 'Describe the fault',
        placeholderSw: 'Eleza hitilafu'
      }
    ],
    sampleServices: ['Inspection', 'Engine service', 'Tyre service', 'Auto electrical'],
    sampleServicesSw: ['Ukaguzi', 'Huduma ya injini', 'Huduma ya tairi', 'Umeme wa gari'],
    modules: ['Vehicle history', 'Estimates', 'Parts & labour', 'Approvals', 'Service reminders']
  },
  {
    id: 'phone_repair',
    name: 'Phone & electronics repair',
    nameSw: 'Matengenezo ya simu na vifaa vya kielektroniki',
    description:
      'Device intake, condition, quote approval, repair stages, parts, warranty and collection.',
    descriptionSw:
      'Mapokezi ya kifaa, hali yake, idhini ya makadirio, hatua za matengenezo, vipuri, dhamana na uchukuaji.',
    entitySingular: 'Repair ticket',
    entitySingularSw: 'Tiketi ya matengenezo',
    entityPlural: 'Repair tickets',
    entityPluralSw: 'Tiketi za matengenezo',
    statuses: [
      'Received',
      'Diagnosing',
      'Quote pending',
      'Approved',
      'Repairing',
      'Testing',
      'Ready',
      'Collected',
      'Warranty return'
    ],
    statusLabelsSw: {
      Received: 'Imepokelewa',
      Diagnosing: 'Uchunguzi',
      'Quote pending': 'Makadirio yanasubiri',
      Approved: 'Imeidhinishwa',
      Repairing: 'Matengenezo yanaendelea',
      Testing: 'Inajaribiwa',
      Ready: 'Tayari',
      Collected: 'Imechukuliwa',
      'Warranty return': 'Imerejeshwa kwa dhamana'
    },
    details: [
      {
        key: 'deviceType',
        label: 'Device type & model',
        labelSw: 'Aina na modeli ya kifaa',
        placeholder: 'e.g. Samsung A15',
        placeholderSw: 'mfano Samsung A15'
      },
      {
        key: 'serialOrImei',
        label: 'IMEI / serial',
        labelSw: 'IMEI / namba ya kifaa',
        placeholder: 'Device identifier',
        placeholderSw: 'Namba ya kifaa'
      },
      {
        key: 'intakeCondition',
        label: 'Intake condition',
        labelSw: 'Hali wakati wa kupokea',
        placeholder: 'Screen cracked, powers on…',
        placeholderSw: 'Kioo kimepasuka, inawaka…'
      }
    ],
    sampleServices: [
      'Screen replacement',
      'Battery replacement',
      'Software support',
      'Diagnostics'
    ],
    sampleServicesSw: ['Kubadilisha kioo', 'Kubadilisha betri', 'Huduma ya programu', 'Uchunguzi'],
    modules: [
      'Device history',
      'Quote approval',
      'Parts used',
      'Warranty tracking',
      'Customer updates'
    ]
  },
  {
    id: 'laundry',
    name: 'Laundry & shoe care',
    nameSw: 'Dobi na usafi wa viatu',
    description:
      'Tag each item, record condition, track cleaning stages, send ready updates and manage pickup or delivery.',
    descriptionSw:
      'Weka lebo kwa kila bidhaa, rekodi hali yake, fuatilia usafi, tuma taarifa na panga uchukuaji au usafirishaji.',
    entitySingular: 'Cleaning order',
    entitySingularSw: 'Agizo la usafi',
    entityPlural: 'Cleaning orders',
    entityPluralSw: 'Maagizo ya usafi',
    statuses: [
      'Received',
      'Tagged',
      'Cleaning',
      'Quality check',
      'Ready',
      'Out for delivery',
      'Collected'
    ],
    statusLabelsSw: {
      Received: 'Imepokelewa',
      Tagged: 'Imewekewa lebo',
      Cleaning: 'Inasafishwa',
      'Quality check': 'Ukaguzi wa ubora',
      Ready: 'Tayari',
      'Out for delivery': 'Imepelekwa',
      Collected: 'Imechukuliwa'
    },
    details: [
      {
        key: 'itemTag',
        label: 'Bag / item tag',
        labelSw: 'Lebo ya begi / bidhaa',
        placeholder: 'Tag number',
        placeholderSw: 'Namba ya lebo'
      },
      {
        key: 'itemCount',
        label: 'Number of items',
        labelSw: 'Idadi ya bidhaa',
        placeholder: '1',
        placeholderSw: '1',
        type: 'number'
      },
      {
        key: 'intakeCondition',
        label: 'Stains / damage noted',
        labelSw: 'Madoa / uharibifu',
        placeholder: 'Condition at intake',
        placeholderSw: 'Hali wakati wa kupokea'
      }
    ],
    sampleServices: ['Wash & fold', 'Dry cleaning', 'Shoe cleaning', 'Pickup & delivery'],
    sampleServicesSw: [
      'Kufua na kukunja',
      'Usafi maalum',
      'Usafi wa viatu',
      'Kuchukua na kupeleka'
    ],
    modules: ['Item tags', 'Condition at intake', 'Pickup & delivery', 'Deposits', 'Ready messages']
  },
  {
    id: 'butcher',
    name: 'Butcher & meat shop',
    nameSw: 'Bucha na duka la nyama',
    description:
      'Fast weighed sales with product cuts, stock references, customer orders and waste/spoilage logging.',
    descriptionSw:
      'Mauzo ya haraka kwa uzito, aina za vipande, kumbukumbu za bidhaa, oda na uandishi wa upotevu.',
    entitySingular: 'Sale',
    entitySingularSw: 'Mauzo',
    entityPlural: 'Sales',
    entityPluralSw: 'Mauzo',
    statuses: [
      'Received',
      'Preparing cut',
      'Ready',
      'Paid / collected',
      'Spoilage recorded',
      'Cancelled'
    ],
    statusLabelsSw: {
      Received: 'Imepokelewa',
      'Preparing cut': 'Inakatwa',
      Ready: 'Tayari',
      'Paid / collected': 'Imelipwa / imechukuliwa',
      'Spoilage recorded': 'Upotevu umeandikwa',
      Cancelled: 'Imeghairiwa'
    },
    details: [
      {
        key: 'meatType',
        label: 'Meat / product',
        labelSw: 'Aina ya nyama / bidhaa',
        placeholder: 'Choose a product',
        placeholderSw: 'Chagua bidhaa',
        type: 'select',
        options: ['Beef', 'Goat', 'Chicken', 'Other'],
        optionsSw: ['Ng’ombe', 'Mbuzi', 'Kuku', 'Nyingine']
      },
      {
        key: 'cut',
        label: 'Cut / preparation',
        labelSw: 'Kipande / maandalizi',
        placeholder: 'Choose a cut',
        placeholderSw: 'Chagua kipande',
        type: 'select',
        options: ['Steak', 'Mince', 'Ribs', 'Custom'],
        optionsSw: ['Steki', 'Nyama ya kusaga', 'Mbavu', 'Maalum']
      },
      {
        key: 'weightKg',
        label: 'Weight (kg)',
        labelSw: 'Uzito (kg)',
        placeholder: '1.25',
        placeholderSw: '1.25',
        type: 'number'
      }
    ],
    sampleServices: ['Beef · per kg', 'Goat · per kg', 'Chicken · per kg', 'Custom cut'],
    sampleServicesSw: [
      'Ng’ombe · kwa kilo',
      'Mbuzi · kwa kilo',
      'Kuku · kwa kilo',
      'Kipande maalum'
    ],
    modules: [
      'Weighed sales',
      'Product cuts',
      'Stock references',
      'Spoilage log',
      'Daily till close'
    ]
  },
  {
    id: 'mobile_money_agent',
    name: 'Mobile money agent',
    nameSw: 'Wakala wa pesa kwa simu',
    description:
      'Record cash-in and cash-out, operator, transaction reference, float movement and shift reconciliation.',
    descriptionSw:
      'Rekodi kuweka na kutoa pesa, mtandao, rejea ya muamala, mabadiliko ya float na hesabu ya zamu.',
    entitySingular: 'Agent transaction',
    entitySingularSw: 'Muamala wa wakala',
    entityPlural: 'Transactions',
    entityPluralSw: 'Miamala',
    statuses: [
      'Started',
      'Awaiting provider confirmation',
      'Completed',
      'Reversed',
      'Reconciliation exception'
    ],
    statusLabelsSw: {
      Started: 'Umeanzishwa',
      'Awaiting provider confirmation': 'Unasubiri uthibitisho wa mtandao',
      Completed: 'Umekamilika',
      Reversed: 'Umerudishwa',
      'Reconciliation exception': 'Tofauti ya hesabu'
    },
    details: [
      {
        key: 'transactionType',
        label: 'Transaction type',
        labelSw: 'Aina ya muamala',
        placeholder: 'Choose type',
        placeholderSw: 'Chagua aina',
        type: 'select',
        options: ['Cash-in', 'Cash-out', 'Airtime', 'Bill payment'],
        optionsSw: ['Kuweka pesa', 'Kutoa pesa', 'Muda wa maongezi', 'Kulipa bili']
      },
      {
        key: 'grossAmount',
        label: 'Customer transaction amount (TZS)',
        labelSw: 'Kiasi cha muamala wa mteja (TZS)',
        placeholder: 'Transaction amount',
        placeholderSw: 'Kiasi cha muamala',
        type: 'number'
      },
      {
        key: 'operator',
        label: 'Mobile money network',
        labelSw: 'Mtandao wa pesa kwa simu',
        placeholder: 'Choose network',
        placeholderSw: 'Chagua mtandao',
        type: 'select',
        options: ['M-Pesa', 'Mixx by Yas', 'Airtel Money', 'HaloPesa'],
        optionsSw: ['M-Pesa', 'Mixx by Yas', 'Airtel Money', 'HaloPesa']
      },
      {
        key: 'providerReference',
        label: 'Provider reference',
        labelSw: 'Rejea ya mtandao',
        placeholder: 'Transaction reference',
        placeholderSw: 'Rejea ya muamala'
      },
      {
        key: 'floatBefore',
        label: 'Float before (TZS)',
        labelSw: 'Float kabla (TZS)',
        placeholder: 'Available float',
        placeholderSw: 'Float iliyopo',
        type: 'number'
      },
      {
        key: 'floatAfter',
        label: 'Float after (TZS)',
        labelSw: 'Float baada (TZS)',
        placeholder: 'Float after transaction',
        placeholderSw: 'Float baada ya muamala',
        type: 'number'
      }
    ],
    sampleServices: ['Cash-in', 'Cash-out', 'Airtime', 'Bill payment'],
    sampleServicesSw: ['Kuweka pesa', 'Kutoa pesa', 'Muda wa maongezi', 'Kulipa bili'],
    modules: [
      'Cash-in / cash-out',
      'Operator references',
      'Float ledger',
      'Shift reconciliation',
      'Discrepancy tracking'
    ]
  },
  {
    id: 'tailor',
    name: 'Tailor & fashion',
    nameSw: 'Fundi cherehani na mitindo',
    description:
      'Capture garment details, private measurements, fitting dates, fabric, deposits and alteration rounds.',
    descriptionSw:
      'Rekodi vazi, vipimo vya faragha, tarehe za kupima, kitambaa, amana na marekebisho.',
    entitySingular: 'Garment order',
    entitySingularSw: 'Agizo la vazi',
    entityPlural: 'Garment orders',
    entityPluralSw: 'Maagizo ya mavazi',
    statuses: [
      'Order received',
      'Measurements taken',
      'Cutting',
      'Sewing',
      'Fitting',
      'Alteration',
      'Ready',
      'Collected'
    ],
    statusLabelsSw: {
      'Order received': 'Agizo limepokelewa',
      'Measurements taken': 'Vipimo vimechukuliwa',
      Cutting: 'Kukata kitambaa',
      Sewing: 'Kushona',
      Fitting: 'Kupima vazi',
      Alteration: 'Marekebisho',
      Ready: 'Tayari',
      Collected: 'Limechukuliwa'
    },
    details: [
      {
        key: 'garment',
        label: 'Garment / style',
        labelSw: 'Vazi / mtindo',
        placeholder: 'Suit, dress, uniform…',
        placeholderSw: 'Suti, gauni, sare…'
      },
      {
        key: 'fabric',
        label: 'Fabric supplied by',
        labelSw: 'Kitambaa kimetolewa na',
        placeholder: 'Customer / shop',
        placeholderSw: 'Mteja / duka'
      },
      {
        key: 'fittingDate',
        label: 'Next fitting date',
        labelSw: 'Tarehe ya kupima vazi',
        placeholder: 'Fitting date',
        placeholderSw: 'Tarehe ya kupima',
        type: 'date'
      }
    ],
    sampleServices: ['Made to measure', 'Alterations', 'Uniforms', 'Repairs'],
    sampleServicesSw: ['Kushona kwa vipimo', 'Marekebisho', 'Sare', 'Matengenezo'],
    modules: [
      'Garment details',
      'Private measurements',
      'Fitting calendar',
      'Fabric tracking',
      'Deposit milestones'
    ]
  }
];

export function getBusinessTemplate(id: string | undefined): BusinessTemplate {
  return businessTemplates.find((template) => template.id === id) ?? businessTemplates[0];
}
