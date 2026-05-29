"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 מתחיל לאכלס מסד נתונים בנתוני דמו...');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 12);
    const admin = await prisma.adminUser.upsert({
        where: { email: process.env.ADMIN_EMAIL || 'admin@bizplus.co.il' },
        update: {},
        create: {
            email: process.env.ADMIN_EMAIL || 'admin@bizplus.co.il',
            passwordHash: adminPassword,
            firstName: process.env.ADMIN_FIRST_NAME || 'Sergey',
            lastName: process.env.ADMIN_LAST_NAME || 'Admin',
            role: 'SUPER_ADMIN',
        },
    });
    console.log(`✅ Admin נוצר: ${admin.email}`);
    const demoPassword = await bcrypt.hash('Demo123!', 12);
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'mispara-demo' },
        update: {},
        create: {
            name: 'מספרת שגב',
            slug: 'mispara-demo',
            email: 'demo@mispara.co.il',
            phone: '0501234567',
            timezone: 'Asia/Jerusalem',
            currency: 'ILS',
            plan: 'PROFESSIONAL',
            isActive: true,
            onboardingCompleted: true,
            settings: {
                appointmentBuffer: 0,
                minBookAhead: 1,
                maxBookAhead: 30,
                cancellationDeadline: 24,
                requireConfirmation: false,
                sendReminders: true,
                reminder24h: true,
                reminder1h: true,
                defaultDuration: 30,
                messageLanguage: 'he',
                messageSignature: 'מספרת שגב 💈',
            },
        },
    });
    console.log(`✅ עסק דמו נוצר: ${tenant.name}`);
    const location = await prisma.location.upsert({
        where: { id: 'loc-demo-001' },
        update: {},
        create: {
            id: 'loc-demo-001',
            tenantId: tenant.id,
            name: 'סניף ראשי',
            address: 'רחוב הרצל 15, תל אביב',
            phone: '0501234567',
            isDefault: true,
        },
    });
    const owner = await prisma.user.upsert({
        where: { id: 'user-demo-owner' },
        update: {},
        create: {
            id: 'user-demo-owner',
            tenantId: tenant.id,
            email: 'demo@mispara.co.il',
            passwordHash: demoPassword,
            firstName: 'שגב',
            lastName: 'כהן',
            role: 'OWNER',
            phone: '0501234567',
        },
    });
    console.log(`✅ בעל עסק דמו: ${owner.email} / Demo123!`);
    const services = [
        { name: 'תספורת גברים', duration: 30, price: 80, color: '#42A5F5', sortOrder: 1 },
        { name: 'תספורת + זקן', duration: 45, price: 120, color: '#66BB6A', sortOrder: 2 },
        { name: 'תספורת ילדים', duration: 20, price: 60, color: '#FFA726', sortOrder: 3 },
        { name: 'צביעת שיער', duration: 90, price: 250, color: '#AB47BC', sortOrder: 4 },
        { name: 'תספורת נשים', duration: 60, price: 180, color: '#EF5350', sortOrder: 5 },
    ];
    const createdServices = [];
    for (const s of services) {
        const service = await prisma.service.upsert({
            where: { id: `service-${s.sortOrder}` },
            update: {},
            create: {
                id: `service-${s.sortOrder}`,
                tenantId: tenant.id,
                name: s.name,
                duration: s.duration,
                price: s.price,
                isActive: true,
                isPublic: true,
                sortOrder: s.sortOrder,
            },
        });
        createdServices.push(service);
    }
    console.log(`✅ ${services.length} שירותים נוצרו`);
    const providers = [
        { firstName: 'יוסי', lastName: 'לוי', color: '#42A5F5', email: 'yossi@mispara.co.il' },
        { firstName: 'דני', lastName: 'ישראלי', color: '#66BB6A', email: 'dani@mispara.co.il' },
        { firstName: 'מיכל', lastName: 'אברהם', color: '#AB47BC', email: 'michal@mispara.co.il' },
    ];
    const createdProviders = [];
    for (let i = 0; i < providers.length; i++) {
        const p = providers[i];
        const userId = `user-provider-${i + 1}`;
        const providerId = `provider-${i + 1}`;
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                tenantId: tenant.id,
                email: p.email,
                passwordHash: await bcrypt.hash('Provider123!', 12),
                firstName: p.firstName,
                lastName: p.lastName,
                role: 'PROVIDER',
            },
        });
        const provider = await prisma.provider.upsert({
            where: { id: providerId },
            update: {},
            create: {
                id: providerId,
                userId: user.id,
                tenantId: tenant.id,
                color: p.color,
                sortOrder: i + 1,
            },
        });
        await prisma.providerLocation.upsert({
            where: { providerId_locationId: { providerId: provider.id, locationId: location.id } },
            update: {},
            create: { providerId: provider.id, locationId: location.id },
        });
        for (const service of createdServices) {
            await prisma.providerService.upsert({
                where: { providerId_serviceId: { providerId: provider.id, serviceId: service.id } },
                update: {},
                create: { providerId: provider.id, serviceId: service.id },
            });
        }
        createdProviders.push(provider);
    }
    console.log(`✅ ${providers.length} נותני שירות נוצרו`);
    for (const provider of createdProviders) {
        for (let day = 0; day <= 6; day++) {
            const isWorking = day !== 6;
            const existing = await prisma.schedule.findFirst({
                where: { providerId: provider.id, locationId: null, dayOfWeek: day },
            });
            if (!existing) {
                await prisma.schedule.create({
                    data: {
                        providerId: provider.id,
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '19:00',
                        isWorking,
                    },
                });
            }
        }
    }
    console.log('✅ לוחות זמנים נוצרו');
    const customers = [
        { firstName: 'אבי', lastName: 'כהן', phone: '0521111111' },
        { firstName: 'שרה', lastName: 'לוי', phone: '0522222222' },
        { firstName: 'מוחמד', lastName: 'עלי', phone: '0523333333' },
        { firstName: 'רונית', lastName: 'אברהם', phone: '0524444444' },
        { firstName: 'דוד', lastName: 'בן דוד', phone: '0525555555' },
    ];
    const createdCustomers = [];
    for (const c of customers) {
        const customer = await prisma.customer.upsert({
            where: { tenantId_phone: { tenantId: tenant.id, phone: c.phone } },
            update: {},
            create: {
                tenantId: tenant.id,
                firstName: c.firstName,
                lastName: c.lastName,
                phone: c.phone,
                source: 'MANUAL',
            },
        });
        createdCustomers.push(customer);
    }
    console.log(`✅ ${customers.length} לקוחות דמו נוצרו`);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    await prisma.subscription.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            plan: 'PROFESSIONAL',
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEnd,
            monthlyPrice: 249,
        },
    });
    console.log('\n🎉 הנתונים אוכלסו בהצלחה!');
    console.log('\n📋 פרטי גישה:');
    console.log(`  👑 Super Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
    console.log(`  🏪 בעל עסק: ${owner.email} / Demo123!`);
    console.log(`  🌐 דשבורד: http://localhost:3000`);
    console.log(`  🔧 Admin: http://localhost:3002`);
    console.log(`  📚 API Docs: http://localhost:3001/api/docs`);
}
main()
    .catch((e) => {
    console.error('❌ שגיאה באכלוס נתונים:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map