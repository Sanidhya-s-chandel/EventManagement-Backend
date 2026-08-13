module.exports = async (query, queryString) => {

    const page = Number(queryString.page) || 1;
    const limit = Number(queryString.limit) || 10;

    const skip = (page - 1) * limit;

    console.log(`Page : ${page}, Limit : ${limit} and Skip : ${skip}`);

    console.log("Query for DB :",query);

    const totalRecords = await query.model.countDocuments(
        query.getFilter()
    );

    const data = await query
        .skip(skip)
        .limit(limit);

    return {
        data,
        pagination: {
            page,
            limit,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            hasNextPage: page * limit < totalRecords,
            hasPreviousPage: page > 1
        }
    };
};