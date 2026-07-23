# Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .

# Downloads dependencies separately for Docker caching.
RUN mvn dependency:go-offline -B

COPY src ./src

# Skip test compilation and execution.
RUN mvn clean package -Dmaven.test.skip=true


# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 10000

ENTRYPOINT ["java", "-jar", "app.jar"]