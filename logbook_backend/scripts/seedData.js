require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const CourseOutlineModule = require('../models/CourseOutlineModule');
const TimetableEntry = require('../models/TimetableEntry');
const LogbookEntry = require('../models/LogbookEntry');
const Hall = require('../models/Hall');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logbook');
    console.log('MongoDB Connected...');

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await CourseOutlineModule.deleteMany({});
    await TimetableEntry.deleteMany({});
    await LogbookEntry.deleteMany({});
    await Hall.deleteMany({});
    console.log('Existing data cleared.');

    // --- Create Departments ---
    console.log('Creating Departments...');
    const fetDepartmentNames = ['Computer', 'Electrical', 'Chemical', 'Mechanical'];
    const departmentPromises = fetDepartmentNames.map(name =>
        Department.findOneAndUpdate({ name }, { name }, { upsert: true, new: true, runValidators: true })
    );
    const departments = await Promise.all(departmentPromises);
    console.log('Departments created/found:', departments.map(d => ({ id: d._id, name: d.name })));

    // --- Create Halls ---
    console.log('Creating Halls...');
    const hallNames = [
        'FET-BGFL', 'TECH1', 'FET-BFF-HALL1', 'FET-BFF-HALL2', 'TECH2',
        'TECH3', 'TECH4', 'CIV LABORATORY', 'CE LABORATORY'
    ];
    const hallPromises = hallNames.map(name =>
        Hall.findOneAndUpdate({ name }, { name }, { upsert: true, new: true, runValidators: true })
    );
    const halls = await Promise.all(hallPromises);
    console.log('Halls created/found:', halls.map(h => h.name));

     // --- Create Users ---
    console.log('Creating Users...');
    const computerDept = departments.find(d => d.name === 'Computer');
    const electricalDept = departments.find(d => d.name === 'Electrical');
    // Add finds for Chemical and Mechanical if needed for assignments
    const chemicalDept = departments.find(d => d.name === 'Chemical');
    const mechanicalDept = departments.find(d => d.name === 'Mechanical');

    if (!computerDept || !electricalDept || !chemicalDept || !mechanicalDept) {
        throw new Error('One or more required FET departments not found after seeding.');
    }
    const users = await User.create([
        { firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: 'admin123', role: 'ADMIN', department: computerDept._id },
        { firstName: 'Teacher', lastName: 'Comp', email: 'teacher.comp@example.com', password: 'teacher123', role: 'TEACHER', department: computerDept._id },
        { firstName: 'Teacher', lastName: 'Elec', email: 'teacher.elec@example.com', password: 'teacher123', role: 'TEACHER', department: electricalDept._id },
        { firstName: 'Teacher', lastName: 'Chem', email: 'teacher.chem@example.com', password: 'teacher123', role: 'TEACHER', department: chemicalDept._id },
        { firstName: 'Teacher', lastName: 'Mech', email: 'teacher.mech@example.com', password: 'teacher123', role: 'TEACHER', department: mechanicalDept._id },
        { firstName: 'Delegate', lastName: 'One', email: 'delegate1@example.com', password: 'delegate123', role: 'DELEGATE', department: computerDept._id },
        { firstName: 'Delegate', lastName: 'Two', email: 'delegate2@example.com', password: 'delegate123', role: 'DELEGATE', department: electricalDept._id }
      ]);
    console.log(`${users.length} users created.`);

    // --- Create Teachers from Provided List ---
    console.log('Creating/Updating Teachers from List...');
    const teacherNamesRaw = [
        "Dr Nguti, D./Mr Forcha Glen",
        "FEUMOE Narcisse Alain",
        "Dr. Temgoua",
        "Dr. Aquigeh",
        "Teiseh Eliasu",
        "Eng. Harvey Sama",
        "Sitamtze Bernard",
        "Ngassam Ines",
        "Mwebi Clautaire",
        "Dr Tsague, A.",
        "Dr Kamdjou",
        "Njike Manette",
        "Dr FUMTCHUM Achille",
        "Fotso Mbobda Christophe Raoul",
        "Dr Dor, C.",
        "Dr. Fotso",
        "Dr. Ayuketah",
        "TCHETGNIA NGASSAM INES LEANA",
        "Bokanda Ekoko Eric",
        "Ligbwah Victor",
        "Ayuk Egbe",
        "Dr Sop Deffo",
        "TEMGOUA Estelle",
        "Akana L.",
        "Dr. Azeufack",
        "Dr. Simo",
        "FEUMOE Alain",
        "Tata Sunjo",
        "Kila Silvester",
        "SITAMTZE YOUMBI BERTRAND",
        "Fozin Fonzin Theophile",
        "Dr Djouela",
        "Dr. Nouadjep",
        "Dr. Musong",
        "Dr. Tsamo Nestor",
        "Dr Nkemeni V.",
        "Backi D.",
        "Lontsi Agostiny",
        "NOUADJEP SERGE",
        "Prof. Fopah",
        "Dr. Wati",
        "Dr Sop",
        "Dr. Simo Domguia",
        "Dr. Wamba",
        "Dr. Awa",
        "Lontsi Agostiny Marrios",
        "Dr. Djob",
        "Dr. Tabetah",
        "Mackongo Jean Christian",
        "Prof. Fopah-Lele",
        "Prof. Fute",
        "Kang Cedric",
        "Dr. Musong Louis Katche",
        "Forcha Glen Beloa",
        "Dr Tsague",
        "Dr. Ngassam",
        "Meh Amstrong",
        "Nouadjep Serge",
        "Fendji Marie",
        "Dr. Nkemeni",
        "SIMO DOMGUIA ULRICH",
        "Dr Wati",
        "Dr Azeufack",
        "Ivan Aquigeh Newen",
        "Dr. AWA TERENCE ACHIRI"
    ];

    const hashedPassword = await bcrypt.hash('slade2021', 10); // Hash the password once

    const parseName = (rawName) => {
        // Remove titles
        let name = rawName.replace(/(Dr\.?|Eng\.?|Prof\.?|Mr\.?|Mrs\.?)\s+/gi, '').trim();
        // Remove initials with periods if they exist after comma or at end
        name = name.replace(/,\s+[A-Z]\.$/, '').replace(/\s+[A-Z]\.$/, '');
        // Handle comma separated initials like 'Nguti, D.' -> 'Nguti'
        name = name.split(',')[0].trim();
        // Split into parts
        const parts = name.split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'Teacher'; // Default lastName if only one part
        const email = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
        return { firstName, lastName, email };
    };

    const teacherPromises = [];
    const createdEmails = new Set(); // Track emails to avoid duplicates from parsing

    teacherNamesRaw.forEach(rawEntry => {
        // Split entries like "Name1/Name2"
        const individualNames = rawEntry.split('/');
        individualNames.forEach(rawName => {
            const { firstName, lastName, email } = parseName(rawName.trim());
            if (firstName && !createdEmails.has(email)) {
                teacherPromises.push(
                    User.findOneAndUpdate(
                        { email: email },
                        {
                            $setOnInsert: {
                                firstName: firstName,
                                lastName: lastName,
                                email: email,
                                password: hashedPassword,
                                role: 'TEACHER',
                                // Assign a default department if needed, e.g., computerDept
                                department: computerDept?._id // Or handle assignment differently
                            }
                        },
                        { upsert: true, new: true, runValidators: true }
                    )
                );
                createdEmails.add(email); // Add email to set to prevent duplicates
            }
        });
    });

    const createdTeachers = await Promise.all(teacherPromises);
    console.log(`${createdTeachers.filter(t => t).length} teachers created/updated from list.`);

    // --- Create Courses ---
    console.log('Preparing Course Data...');
    const courseListString = `
        ENG101: Use of English 1
        FRE101: Functional French 1
        ENG102: Use of English II
        MEF111:
        MEF201:
        MEF209:
        MEF211:
        MEF213:
        MEF301:
        MEF303:
        MEF305:
        MEF353:
        MEF361:
        MEF401:
        MEF403:
        MEF453:
        MEF461:
        MEF475:
        MEF481:
        MEF491:
        CEF201: Analysis
        CEF203: Linear Algebra
        CEF205: Introduction To Computing
        CEF207: Programming I
        CEF211: Bool. Alg&Logic Circuits
        CEF331: Obj. Oriented Mod and U
        CEF333: Hard, and Soft. Maint Lab
        CEF341: Algo, and Data Structures
        CEF345: Soft. Dpt Tools (AGL)
        CEF349: Analysis and Design of IS
        CEF401: Operational Research
        CEF405: Analysis and Design of Algorithms
        CEF415: Technical Writing
        CEF421: Network Administration
        CEF427: Advanced Operating Systems
        CEF431: Soft. Quality Tools and Methods
        CEF445: Wireless Com. And Sensor Networks / Sensor Networks
        CEF447: Data Warehouse and Datamining
        CEF451: Sec. of Inf. Systems and Cybersecurity
        CEF453: Net. Design and Sim. (Packettracer, Ns2, Isim)
        CEF473: Syst. Admin. (Unix, Linux, Windows)
        CEF479: Computer Networks Laboratory
        EEF261: Circuit Analysis
        EEF263: Digital Electronics I
        EEF265: Signals and Systems
        EEF267: Fundamentals of Electrical Engineering
        EEF269: Physics for Engineering 1
        EEF333: Introduction to Renewable
        EEF349: Fundamentals of Electrical
        EEF361: Electronic Measurements
        EEF363: Analog Electronics II
        EEF365: Microcontrollers und Micro
        EEF367: Digital Electronic Lab
        EEF445: Sensor Networks
        EEF461: Radio and Television
        EEF463: Optical Network Communic
        EEF465: Transmissions systems
        EEF467: Feedback Systems
        EEF469: Microelectronics
        EEF471: Basic Telecommunication
        EEF481: Electric Machines II
        EEF483: Power Electronics and control
        EEF485: Sequence Control Lab
        EEF487: Electrical Power Systems Eng. 1
        EEF489: Electrical Installations
        EEF491: Renewable Energy Comp. and Tech.
        EEF493: Electrical Transmission lines
        CIV213:
        CIV217:
        CIV219:
        CIV221:
        CIV229:
        CIV305:
        CIV313:
        CIV315:
        CIV321:
        CIV323:
        CIV327:
        CIV329:
        CIV401:
        CIV405:
        CIV407:
        CIV409:
        CIV411:
        CIV413:
        CIV415:
        CIV417:
        CPE201: Introduction to Petroleum Engineering
        CPE203: Introduction to Chemical Engineering
        FET301: Probability and Statistics
        CEF238: C/C++ Programming
        CEF250: Computer Architecture
        CEF254: Algebra
        CEF342: Database and Design
        CEF344: Client-Server and Web Application Development (PHP, JavaScript, XML, J2EE)
        CEF346: Object Oriented Programming (JAVA/C++)
        CEF352: Tools and Numerical Methods for Engineering
        CEF354: Switching and Routing Protocols
        CEF356: Mobile Communications and Protocols
        CEF364: Local Area Computer Network
        CEF432: Network Security Fundamentals
        CEF438: Advanced Databases and Administration (Oracle/MySQL)
        CEF440: Internet Programming (J2EE) and Mobile Programming
        CEF444: Artificial Intelligence and Machine Learning
        CEF450: Cloud Computing and Service Oriented Architectures
        CEF458: Enterprise IP and telephony and video Network
        CEF462: Digital Image Processing
        CEF468: Database and PhP programming
        CEF472: Human Computer Interface
        CEF474: Software Verification and Validation Techniques
        CEF476: Software Engineering and Design
        CEF478: Network Administration
        CEF482: XML and Document Content Description
        CEF488: System and Network Programming
        CIV202: Materials Science & Technology
        CIV214: CHEMISTRY II
        CIV222: Linear Algebra
        CIV228: Programming and Application Software
        CIV234: Introduction to Architecture
        CIV310: Thermodynamics
        CIV322: Mechanics of Continuous Medium
        CIV328: Geotechnical Engineering
        CIV330: General Concepts of Economy, Management and Entrepreneurship
        CIV334: Strength of materials
        CIV336: Design, Architecture and Building Technology
        CIV402: Reinforced concrete I
        CIV404: Fluid Mechanics and Hydraulic Constructions
        CIV406: Structural Analysis
        CIV408: Geotechnical Lab 1
        CIV410: Fundamentals of Building Information Management (BIM)
        CIV412: Resistance of materials
        CIV414: Introduction to Topography and Surveying
        CIV416: Introduction to Urbanism and Transport
        CIV418: Quality, Safety, and Environmental Management
        CIV502: Reinforced concrete 2
        CPE208: Chemical Process Principle
        CPE212: GENERAL GEOLOGY
        EEF260: Analog Electronics I
        EEF262: Physics for Engineering II
        EEF264: Control Engineering Instrumentation
        EEF268: Digital Electronics II
        EEF364: Basic Telecommunications
        EEF366: Sequence Control
        EEF462: Digital Signal Processing
        EEF464: Wireless and Mobile Communications
        EEF466: Antenna and Propagation
        EEF474: Coding Theory
        EEF480: Control of Electrical Machines
        EEF482: Electric Machines III / Electric Machines II
        EEF484: Electrical Power Systems Engineering II
        EEF490: Hybrid Energy Components and Systems
        MEF202: Materials Science and Technology
        MEF204: Basics of Mechanical Drawing
        MEF240: Introduction to Thermodynamics
        MEF268: Electrical Engineering for Mechanical Engineers
        MEF302: Design 2: Machine Element Design
        MEF354: Thermodynamics
        MEF360: Fluid Mechanics II
        MEF366: Heat Transfer
        MEF368: Design and operation of chemical apparatus
        MEF370: Process Technology & Design
        MEF449: Metallurgy of Welded Joints
        MEF460: Design Graphics for Mechanical Engineering
        MEF476: Technical Writing
        MEF480: Basics of Automobile Mechanics
        MEF486: Basic of Mechatronics
    `;

    const departmentMap = {
        CEF: departments.find(d => d.name === 'Computer')?._id,
        EEF: departments.find(d => d.name === 'Electrical')?._id,
        MEF: departments.find(d => d.name === 'Mechanical')?._id,
        CIV: departments.find(d => d.name === 'Chemical')?._id, // Assuming CIV -> Chemical
        CPE: departments.find(d => d.name === 'Chemical')?._id, // Assuming CPE -> Chemical
        // Default for ENG, FRE, FET etc. - Assigning to Computer for now
        DEFAULT: departments.find(d => d.name === 'Computer')?._id
    };

    const coursesToSeed = courseListString
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes(':'))
        .map(line => {
            const parts = line.split(':');
            const code = parts[0].trim();
            let title = parts.slice(1).join(':').trim();
            if (!title) title = `Title for ${code}`;

            const levelMatch = code.match(/\d/);
            let level = levelMatch ? (parseInt(levelMatch[0], 10) * 100) : 100;
            
            // Adjust level validation/correction slightly
            const validLevels = [100, 200, 300, 400, 500, 600];
            if (!validLevels.includes(level)) {
                // Check for 500 level code specifically
                if (code.match(/[a-zA-Z]+5\d{2}/)) {
                    level = 500;
                } else {
                    console.warn(`Invalid level calculated for ${code}, defaulting to 100.`);
                    level = 100; 
                }
            }

            const prefix = code.substring(0, 3).toUpperCase();
            let departmentId = departmentMap[prefix] || departmentMap.DEFAULT;

            if (!departmentId) {
                 console.error(`FATAL: Could not find department ID for prefix ${prefix} or default.`);
                 throw new Error(`Department ID missing for course code ${code}. Check departmentMap and seeded departments.`);
             }

            return {
                code: code,
                title: title,
                level: level,
                department: departmentId,
                description: `Description for ${title}`, // Default description
                status: 'Active'
            };
        })
        .filter(course => course !== null); 

    console.log(`Attempting to insert ${coursesToSeed.length} courses...`);
    if (coursesToSeed.length > 0) {
        try {
            const insertedCourses = await Course.insertMany(coursesToSeed, { ordered: false });
            console.log(`${insertedCourses.length} courses inserted successfully.`);
        } catch (e) {
            console.error("Error during Course.insertMany:", e);
            if (e.writeErrors) {
                e.writeErrors.forEach(err => console.error(`  - Insert Error: ${err.err.message}`));
            }
        }
    } else {
        console.log('No courses found to insert.');
    }
    // --- END OF COURSE SEEDING ---

    // --- Comment out dependent seeding for now ---
    console.log('Skipping Module, Timetable, and Logbook entry seeding for now.');
    /*
    const courses = await Course.find(); // Need to re-fetch courses IF we seed below
    const halls = await Hall.find(); // Re-fetch halls
    const users = await User.find(); // Re-fetch users

    // Need logic here to find the specific courses/users/halls from the larger seeded data
    const course1 = courses.find(c => c.code === 'COMP201');
    const course2 = courses.find(c => c.code === 'ELEC201');
    const teacher1 = users.find(u => u.email === 'teacher.comp@example.com');
    const teacher2 = users.find(u => u.email === 'teacher.elec@example.com');
    const delegate1 = users.find(u => u.email === 'delegate1@example.com');
    const delegate2 = users.find(u => u.email === 'delegate2@example.com');
    const hall1 = halls.find(h => h.name === 'FET-BGFL');
    const hall2 = halls.find(h => h.name === 'TECH1');
    
    // Add checks to ensure all found items exist before proceeding
    if(!course1 || !course2 || !teacher1 || !teacher2 || !delegate1 || !delegate2 || !hall1 || !hall2) {
        console.warn('Could not find all required items for dependent seeding (Modules, Timetable, Logbook). Skipping.');
    } else {
        // Create modules
        console.log('Creating Modules...');
        const modules = await CourseOutlineModule.create([
          { title: 'Programming Basics', description: 'Introduction', order: 1, course: course1._id, status: 'Pending' },
          { title: 'Data Structures', description: 'Basics', order: 2, course: course1._id, status: 'Pending' },
          { title: 'DC Circuits', description: 'Analysis', order: 1, course: course2._id, status: 'Pending' },
          { title: 'AC Circuits', description: 'Analysis', order: 2, course: course2._id, status: 'Pending' }
        ]);
        console.log(`${modules.length} modules created.`);

        // Create timetable entries
        console.log('Creating Timetable Entries...');
        const timetableEntriesData = [
          { course: course1._id, teacher: teacher1._id, level: '200', dayOfWeek: 'Monday', startTime: '09:00', endTime: '11:00', hall: hall1._id },
          { course: course2._id, teacher: teacher2._id, level: '200', dayOfWeek: 'Wednesday', startTime: '13:00', endTime: '15:00', hall: hall2._id }
        ];
        const timetableEntries = await TimetableEntry.insertMany(timetableEntriesData);
        console.log(`${timetableEntries.length} timetable entries created.`);

        // Create logbook entries
        console.log('Creating Logbook Entries...');
        await LogbookEntry.create([
          { delegate: delegate1._id, course: course1._id, timetableEntry: timetableEntries[0]._id, coveredModules: [modules[0]._id], remarks: 'Remarks 1', attendanceDetails: 'Present', status: 'Pending Review' },
          { delegate: delegate2._id, course: course2._id, timetableEntry: timetableEntries[1]._id, coveredModules: [modules[2]._id], remarks: 'Remarks 2', attendanceDetails: 'Present', status: 'Pending Review' }
        ]);
        console.log('Logbook entries created.');
    }
    */

    console.log('Database seeding process completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData(); 