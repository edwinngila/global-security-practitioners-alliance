import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Roles
  const rolesData = [
    { name: 'admin', displayName: 'Admin', description: 'Full system access and administration' },
    { name: 'master_practitioner', displayName: 'Master Practitioner', description: 'Advanced practitioner with content creation capabilities' },
    { name: 'practitioner', displayName: 'Practitioner', description: 'Standard practitioner role with basic access' },
  ];

  const roles = [];
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        displayName: r.displayName,
        description: r.description,
      },
    });
    roles.push(role);
  }

  // Comprehensive permissions for all roles
  const permissionsData = [
    // Admin permissions
    { name: 'manage_users', displayName: 'Manage Users', resource: 'user', action: 'manage' },
    { name: 'manage_payments', displayName: 'Manage Payments', resource: 'payment', action: 'manage' },
    { name: 'view_payment_reports', displayName: 'View Payment Reports', resource: 'payment', action: 'view_reports' },
    { name: 'generate_payment_reports', displayName: 'Generate Payment Reports', resource: 'payment', action: 'generate_reports' },
    { name: 'manage_contact_inquiries', displayName: 'Manage Contact Inquiries', resource: 'contact', action: 'manage' },
    { name: 'manage_site_settings', displayName: 'Manage Site Settings', resource: 'settings', action: 'manage' },
    { name: 'manage_roles_permissions', displayName: 'Manage Roles & Permissions', resource: 'role', action: 'manage' },
    { name: 'manage_modules', displayName: 'Manage Modules', resource: 'module', action: 'manage' },
    { name: 'view_site_analytics', displayName: 'View Site Analytics', resource: 'analytics', action: 'view' },
    { name: 'generate_custom_reports', displayName: 'Generate Custom Reports', resource: 'report', action: 'generate' },
    { name: 'manage_system_backups', displayName: 'Manage System Backups', resource: 'system', action: 'backup' },

    // Master Practitioner permissions
    { name: 'create_module_content', displayName: 'Create Module Content', resource: 'module_content', action: 'create' },
    { name: 'edit_module_content', displayName: 'Edit Module Content', resource: 'module_content', action: 'edit' },
    { name: 'create_exams', displayName: 'Create Exams', resource: 'exam', action: 'create' },
    { name: 'manage_exams', displayName: 'Manage Exams', resource: 'exam', action: 'manage' },
    { name: 'manage_own_profile', displayName: 'Manage Own Profile', resource: 'profile', action: 'manage_own' },
    { name: 'view_module_analytics', displayName: 'View Module Analytics', resource: 'module', action: 'view_analytics' },
    { name: 'moderate_content_feedback', displayName: 'Moderate Content Feedback', resource: 'feedback', action: 'moderate' },

    // Practitioner (Student) permissions
    { name: 'view_modules', displayName: 'View Modules', resource: 'module', action: 'view' },
    { name: 'enroll_modules', displayName: 'Enroll in Modules', resource: 'module', action: 'enroll' },
    { name: 'access_paid_content', displayName: 'Access Paid Content', resource: 'module_content', action: 'access_paid' },
    { name: 'view_payment_reports', displayName: 'View Payment Reports', resource: 'payment', action: 'view_own' },
    { name: 'view_certificates', displayName: 'View Certificates', resource: 'certificate', action: 'view' },
    { name: 'download_certificates', displayName: 'Download Certificates', resource: 'certificate', action: 'download' },
    { name: 'track_certificate_progress', displayName: 'Track Certificate Progress', resource: 'certificate', action: 'track_progress' },
    { name: 'manage_own_account', displayName: 'Manage Own Account', resource: 'account', action: 'manage_own' },
  ];

  const permissions = [];
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: {
        name: p.name,
        displayName: p.displayName,
        resource: p.resource,
        action: p.action,
      },
    });
    permissions.push(perm);
  }

  // Assign permissions to roles based on capabilities

  // Admin gets all permissions
  const adminRole = roles.find(r => r.name === 'admin');
  if (adminRole) {
    const adminPermissions = permissions.filter(p =>
      ['manage_users', 'manage_payments', 'view_payment_reports', 'generate_payment_reports',
       'manage_contact_inquiries', 'manage_site_settings', 'manage_roles_permissions',
       'manage_modules', 'view_site_analytics', 'generate_custom_reports', 'manage_system_backups'].includes(p.name)
    );
    for (const perm of adminPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Master Practitioner permissions
  const masterPractitionerRole = roles.find(r => r.name === 'master_practitioner');
  if (masterPractitionerRole) {
    const masterPermissions = permissions.filter(p =>
      ['create_module_content', 'edit_module_content', 'create_exams', 'manage_exams',
       'manage_own_profile', 'view_module_analytics', 'moderate_content_feedback',
       'manage_modules', 'manage_contact_inquiries'].includes(p.name)
    );
    for (const perm of masterPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: masterPractitionerRole.id, permissionId: perm.id } },
        update: {},
        create: {
          roleId: masterPractitionerRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Practitioner (Student) permissions
  const practitionerRole = roles.find(r => r.name === 'practitioner');
  if (practitionerRole) {
    const practitionerPermissions = permissions.filter(p =>
      ['view_modules', 'enroll_modules', 'access_paid_content', 'view_payment_reports',
       'view_certificates', 'download_certificates', 'track_certificate_progress', 'manage_own_account'].includes(p.name)
    );
    for (const perm of practitionerPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: practitionerRole.id, permissionId: perm.id } },
        update: {},
        create: {
          roleId: practitionerRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Default admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'adminpass';

  const hashed = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashed,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          nationality: 'Unknown',
          gender: 'OTHER',
          dateOfBirth: new Date('1990-01-01'),
          phoneNumber: '0000000000',
          email: adminEmail,
          designation: 'Administrator',
          organizationName: 'GSPA',
          documentType: 'PASSPORT',
          documentNumber: 'ADMIN001',
          isActive: true,
        }
      }
    },
  });

  // Assign admin role to profile if exists
  const profile = await prisma.profile.findUnique({ where: { id: adminUser.id } });
  if (profile && adminRole) {
    await prisma.profile.update({
      where: { id: profile.id },
      data: { roleId: adminRole.id },
    });
  }

  // Sample module
  const sampleModule = await prisma.module.upsert({
    where: { id: 'module-sample-1' },
    update: {},
    create: {
      id: 'module-sample-1',
      title: 'Introduction to Security Practices',
      description: 'A sample module about security basics.',
      category: 'security',
      difficultyLevel: 'BEGINNER',
      estimatedDuration: 60,
      price: 0.0,
      currency: 'USD',
      isActive: true,
      createdById: adminUser.id,
    },
  });

  // Default modules based on 011_add_modules_system.sql
  const defaultModules = [
    {
      id: 'module-cybersecurity-fundamentals',
      title: 'Cybersecurity Fundamentals',
      description: 'Master the essential concepts of cybersecurity including threat identification, risk assessment, and basic security protocols. This comprehensive course covers everything from basic network security to advanced threat detection techniques.',
      shortDescription: 'Learn the fundamentals of cybersecurity and protect digital assets',
      category: 'Cybersecurity',
      difficultyLevel: 'BEGINNER' as const,
      estimatedDuration: 40,
      price: 200.00,
      currency: 'USD',
      maxStudents: 50,
      prerequisites: 'Basic computer knowledge',
      learningObjectives: [
        'Understand cybersecurity principles and concepts',
        'Identify common security threats and vulnerabilities',
        'Implement basic security measures',
        'Conduct risk assessments',
        'Use security tools and technologies'
      ],
      instructorName: 'Dr. Sarah Johnson',
      instructorBio: 'Dr. Sarah Johnson is a leading cybersecurity expert with over 15 years of experience in the field. She has worked with Fortune 500 companies and government agencies, specializing in cybersecurity education and training.'
    },
    {
      id: 'module-advanced-network-security',
      title: 'Advanced Network Security',
      description: 'Dive deep into advanced network security concepts including firewall configuration, intrusion detection systems, VPNs, and secure network architecture design.',
      shortDescription: 'Advanced network security techniques and implementation',
      category: 'Network Security',
      difficultyLevel: 'ADVANCED' as const,
      estimatedDuration: 60,
      price: 360.00,
      currency: 'USD',
      maxStudents: 30,
      prerequisites: 'Cybersecurity Fundamentals or equivalent experience',
      learningObjectives: [
        'Design secure network architectures',
        'Configure advanced firewalls and IDS/IPS',
        'Implement VPN and secure remote access',
        'Conduct network penetration testing',
        'Manage security incidents and responses'
      ],
      instructorName: 'Prof. Michael Chen',
      instructorBio: 'Prof. Michael Chen is a renowned network security specialist and professor at MIT. He has authored several books on network security and has consulted for major telecommunications companies worldwide.'
    },
    {
      id: 'module-digital-forensics',
      title: 'Digital Forensics and Incident Response',
      description: 'Learn the art and science of digital forensics, evidence collection, analysis, and incident response planning. Master the tools and techniques used by forensic investigators.',
      shortDescription: 'Digital evidence collection, analysis, and incident response',
      category: 'Digital Forensics',
      difficultyLevel: 'INTERMEDIATE' as const,
      estimatedDuration: 50,
      price: 280.00,
      currency: 'USD',
      maxStudents: 40,
      prerequisites: 'Basic cybersecurity knowledge recommended',
      learningObjectives: [
        'Collect and preserve digital evidence',
        'Conduct forensic analysis of digital devices',
        'Use forensic tools and software',
        'Create incident response plans',
        'Present findings in legal proceedings'
      ],
      instructorName: 'Dr. Emily Rodriguez',
      instructorBio: 'Dr. Emily Rodriguez is a certified forensic investigator and former FBI digital forensics specialist. She has testified in numerous high-profile cybercrime cases and is a leading expert in digital evidence analysis.'
    },
    {
      id: 'module-ethical-hacking',
      title: 'Ethical Hacking and Penetration Testing',
      description: 'Become an ethical hacker by learning penetration testing methodologies, vulnerability assessment, and responsible disclosure practices.',
      shortDescription: 'Learn ethical hacking techniques and penetration testing',
      category: 'Ethical Hacking',
      difficultyLevel: 'INTERMEDIATE' as const,
      estimatedDuration: 55,
      price: 320.00,
      currency: 'USD',
      maxStudents: 35,
      prerequisites: 'Basic cybersecurity knowledge',
      learningObjectives: [
        'Understand ethical hacking principles',
        'Conduct vulnerability assessments',
        'Perform penetration testing',
        'Use hacking tools and techniques',
        'Write security reports and recommendations'
      ],
      instructorName: 'Marcus Thompson',
      instructorBio: 'Marcus Thompson is a certified ethical hacker (CEH) and OSCP holder with extensive experience in penetration testing. He has worked with major corporations to identify and fix security vulnerabilities.'
    },
    {
      id: 'module-cloud-security',
      title: 'Cloud Security and Compliance',
      description: 'Master cloud security principles, compliance frameworks, and secure cloud architecture design for AWS, Azure, and GCP platforms.',
      shortDescription: 'Secure cloud infrastructure and ensure compliance',
      category: 'Cloud Security',
      difficultyLevel: 'INTERMEDIATE' as const,
      estimatedDuration: 45,
      price: 240.00,
      currency: 'USD',
      maxStudents: 45,
      prerequisites: 'Basic cloud computing knowledge',
      learningObjectives: [
        'Design secure cloud architectures',
        'Implement cloud security controls',
        'Ensure compliance with regulations',
        'Manage cloud security incidents',
        'Use cloud security tools and services'
      ],
      instructorName: 'Dr. Lisa Park',
      instructorBio: 'Dr. Lisa Park is a cloud security architect and AWS certified solutions architect. She specializes in helping organizations secure their cloud infrastructure and achieve compliance with industry standards.'
    }
  ];

  // Create default modules
  for (const moduleData of defaultModules) {
    await prisma.module.upsert({
      where: { id: moduleData.id },
      update: {},
      create: {
        ...moduleData,
        isActive: true,
        isFeatured: false,
        createdById: adminUser.id,
      },
    });
  }

  console.log('Created default modules');

  // Sample questions
  const q1 = await prisma.testQuestion.upsert({
    where: { id: 'q-sample-1' },
    update: {},
    create: {
      id: 'q-sample-1',
      question: 'What is the most important aspect of security? ',
      category: 'general',
      difficulty: 'EASY',
      moduleId: sampleModule.id,
    },
  });

  await prisma.questionOption.upsert({
    where: { id: 'q1-a' },
    update: {},
    create: {
      id: 'q1-a',
      questionId: q1.id,
      optionText: 'People',
      optionLetter: 'A',
      isCorrect: true,
    }
  });
  await prisma.questionOption.upsert({
    where: { id: 'q1-b' },
    update: {},
    create: {
      id: 'q1-b',
      questionId: q1.id,
      optionText: 'Computers',
      optionLetter: 'B',
      isCorrect: false,
    }
  });

  console.log('Seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
