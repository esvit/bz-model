module.exports = function(grunt) {
    grunt.initConfig({
        cmpnt: grunt.file.readJSON('bower.json'),
        banner: '/*! bzModel v<%= cmpnt.version %> by Vitalii Savchuk(esvit666@gmail.com) - ' +
                'https://github.com/esvit/bz-model - New BSD License */\n',
        clean: {
            working: {
                src: ['bz-model.*', './.temp/views', './.temp/']
            }
        },
        uglify: {
            js: {
                src: ['bz-model.src.js'],
                dest: 'bz-model.js',
                options: {
                    banner: '<%= banner %>',
                    sourceMap: function(fileName) {
                        return fileName.replace(/\.js$/, '.map');
                    }
                }
            }
        },
        concat: {
            js: {
                src: ['src/scripts/*.js'],
                dest: 'bz-model.src.js'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('dev', [
        'clean',
        'concat'
    ]);
    return grunt.registerTask('default', [
        'dev',
        'uglify'
    ]);
};