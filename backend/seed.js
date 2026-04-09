const { User, Carrier, Recipient } = require('./models');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.create({
            name: 'Administrador Principal',
            email: 'admin@packflow.com',
            password: hashedPassword,
            role: 'Admin'
        });

        await Carrier.create({ name: 'DHL', phone: '555-0101', website: 'dhl.com' });
        await Carrier.create({ name: 'FedEx', phone: '555-0202', website: 'fedex.com' });
        await Carrier.create({ name: 'Estafeta', phone: '555-0303', website: 'estafeta.com' });

        await Recipient.create({ name: 'Juan Perez', department: 'TI' });
        await Recipient.create({ name: 'Maria Gomez', department: 'Recursos Humanos' });

        console.log('Datos semilla creados exitosamente!');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seed();
