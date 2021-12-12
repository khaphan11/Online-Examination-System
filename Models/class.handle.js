const sql = require('./_database.connect').sql;
const db_config = require('./_database.connect').mssql_config;

function ExcuteSQL(query) {
    return sql.connect(db_config)
        .then(function() {
            return new sql.Request()
                .query(query)
                .catch(function(err) {
                    console.log("Error!!!", err);
                });
        })
        .catch(function(err) {
            console.log("Error!!!", err);
        });
}

module.exports = {
    getAllClasses: function() {
        return ExcuteSQL(`SELECT * FROM tb_Class`);
    },
    createClass: function(TeacherID, ClassName) {
        return ExcuteSQL(`
            INSERT INTO tb_Class VALUES (N'${ClassName}', ${TeacherID}, NULL)
        `);
    },
    getClassByID: function(ClassID) {
        return ExcuteSQL(`SELECT * FROM tb_Class where ClassID = ${ClassID}`);
    },
    getClassesByTeacher: function(UserID) {
        return ExcuteSQL(`
            SELECT ClassID, ClassName, [dbo].CheckIfClassHasMember(ClassID) AS TotalStudents, 
            [dbo].CheckIfClassHasExam(ClassID) AS TotalAssignments, UserID
            FROM tb_Class WHERE UserID = ${UserID}
        `);
    },
    getClassByTeacher: function(UserID, ClassID) {
        return ExcuteSQL(`
            SELECT ClassID, ClassName, [dbo].CheckIfClassHasMember(ClassID) AS TotalStudents, 
            [dbo].CheckIfClassHasExam(ClassID) AS TotalAssignments, UserID
            FROM tb_Class WHERE ClassID = ${ClassID} AND UserID = ${UserID}
        `);
    },
    getClassByStudent: function(UserID) {
        return ExcuteSQL(`
            SELECT C.ClassID, C.ClassName, Num.TotalStudents, U.UserID AS TeacherID, CONCAT(U.Firstname, ' ', U.Lastname) AS TeacherFullname
            FROM
            (SELECT ClassID, COUNT(*) AS TotalStudents FROM tb_ClassMember
            WHERE ClassID IN (SELECT ClassID FROM tb_ClassMember WHERE UserID = ${UserID})
            GROUP BY ClassID) AS Num
            JOIN tb_Class AS C ON C.ClassID = Num.ClassID
            JOIN tb_User AS U ON U.UserID = C.UserID
        `);
    },
    getMember: function(ClassID) {
        return ExcuteSQL(`
            select * from tb_User where UserID in
            (select UserID from tb_ClassMember where ClassID = ${ClassID})
        `);
    },
    addMember: function(ClassID, userID) {
        return ExcuteSQL(`
            insert into tb_ClassMember values(${ClassID}, ${userID})
        `);   
    },
    deleteMember: function(ClassID, userID) {
        return ExcuteSQL(`
            delete from tb_ClassMember where ClassID = ${ClassID} and UserID = ${userID} 
        `);
    },
    changeName: function(ClassID, newName) {
        return ExcuteSQL(`
            update tb_Class set ClassName = N'${newName}' where ClassID = ${ClassID}
        `);
    },
    deleteClass: function(ClassID) {
        return ExcuteSQL(`
            delete from tb_Class where ClassID = ${ClassID}
        `);
    },
}

