FROM adoptopenjdk/openjdk16:ubi AS build
RUN mkdir /opt/app
COPY . /opt/app
WORKDIR /opt/app
RUN ./gradlew build --no-daemon 

FROM adoptopenjdk/openjdk16:ubi-jre

EXPOSE 8080

RUN mkdir /opt/app

COPY --from=build /opt/app/build/libs/pankration-0.0.1-SNAPSHOT.jar /opt/app/pankration.jar

ENTRYPOINT ["java","-jar","/opt/app/pankration.jar"]
