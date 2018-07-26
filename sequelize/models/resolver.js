module.exports = (sequelize, DataTypes) => {
  const Resolver = sequelize.define('Resolver', {
    type: DataTypes.STRING,
    field: DataTypes.STRING,
    preHook: DataTypes.STRING,
    postHook: DataTypes.STRING,
    requestMapping: DataTypes.TEXT,
    responseMapping: DataTypes.TEXT,
    publish: DataTypes.TEXT
  })

  Resolver.associate = (models) => {
    models.Resolver.belongsTo(models.DataSource, {
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false
      }
    })

    models.Resolver.belongsTo(models.GraphQLSchema, {
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false
      }
    })
  }

  return Resolver
}
