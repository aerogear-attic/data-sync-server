module.exports = (sequelize, DataTypes) => {
  const GraphQLSchema = sequelize.define('GraphQLSchema', {
    name: DataTypes.STRING,
    schema: DataTypes.TEXT
  })

  return GraphQLSchema
}
