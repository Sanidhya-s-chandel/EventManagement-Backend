const generateSeatLayout = (rowConfig, pricingConfig) => {

    console.log("Generating seat layout...");

    const seats = [];

    rowConfig.forEach(({ row, category, seats: seatCount }) => {

        const price = pricingConfig[category];

        if (!price) {
            throw new Error(`Price not found for category: ${category}`);
        }

        seats.push(
            ...Array.from(
                { length: seatCount },
                (_, index) => ({
                    seatNumber: `${row}${index + 1}`,
                    row,
                    seatNumber: index + 1,
                    category,
                    price,
                    status: "available"
                })
            )
        );

    });

    console.log(`${seats.length} seats generated successfully.`);

    return seats;
};

module.exports = { generateSeatLayout };