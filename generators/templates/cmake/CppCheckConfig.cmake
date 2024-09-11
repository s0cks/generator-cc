find_program(CPPCHECK_BIN NAMES cppcheck REQUIRED)
if(CPPCHECK_BIN)
  execute_process(
    COMMAND ${CPPCHECK_BIN} --version
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    ERROR_QUIET
    OUTPUT_VARIABLE CPPCHECK_VERSION
    OUTPUT_STRIP_TRAILING_WHITESPACE)

  # --suppressions-list
  set(CPPCHECK_SUPRESSIONS_FILE "${CMAKE_SOURCE_DIR}/.suppress.cppcheck")
  if(EXISTS ${CPPCHECK_SUPRESSIONS_FILE})
    set(CPPCHECK_SUPPRESSIONS_ARG
        "--suppressions-list=${CPPCHECK_SUPRESSIONS_FILE}"
        CACHE STRING "The suppressions file to use.")
  else()
    message(
      STATUS "no cppcheck suppressions file found: ${CPPCHECK_SUPRESSIONS_FILE}"
    )
    set(CPPCHECK_SUPPRESSIONS_ARG
        ""
        CACHE STRING "The suppressions file to use.")
  endif()

  # -j X
  include(ProcessorCount)
  ProcessorCount(CPU_CORES)
  set(CPPCHECK_THREADS_ARG
      "-j ${CPU_CORES}"
      CACHE STRING "The number of cores for cppcheck to use.")

  # --error-exitcode=X
  if(CPPCHECK_EXIT_CODE)
    set(CPPCHECK_EXIT_CODE_ARG
        "--error-exitcode=${CPPCHECK_EXIT_CODE}"
        CACHE STRING "The exitcode to use if an error is found.")
  else()
    set(CPPCHECK_EXIT_CODE_ARG
        "--error-exitcode=0"
        CACHE STRING "The exitcode to use if an error is found.")
  endif()

  # --cppcheck-build-dir=X
  set(CPPCHECK_BUILD_DIR "${PROJECT_BINARY_DIR}/cppcheck")
  if(NOT EXISTS ${CPPCHECK_BUILD_DIR})
    file(MAKE_DIRECTORY ${CPPCHECK_BUILD_DIR})
  endif()
  set(CPPCHECK_BUILD_DIR_ARG
      "--cppcheck-build-dir=${CPPCHECK_BUILD_DIR}"
      CACHE STRING "The build directory to use.")

  # --template
  if(NOT CPPCHECK_TEMPLATE)
    set(CPPCHECK_TEMPLATE
        "vs"
        CACHE STRING "The template to use.")
  endif()
  set(CPPCHECK_TEMPLATE_ARG
      "--template=${CPPCHECK_TEMPLATE}"
      CACHE STRING "The template argument to use.")

  # excludes
  set(CPPCHECK_EXCLUDES_ARG)
  foreach(excluded ${CPPCHECK_EXCLUDES})
    list(APPEND CPPCHECK_EXCLUDES_ARG "-i${excluded}")
  endforeach(excluded)

  # other args
  set(CPPCHECK_OTHER_ARGS
      ""
      CACHE STRING "Other arguments for cppcheck.")

  set(CPPCHECK_OPTS
      ${CPPCHECK_THREADS_ARG}
      ${CPPCHECK_SUPPRESSIONS_ARG}
      ${CPPCHECK_EXIT_CODE_ARG}
      ${CPPCHECK_BUILD_DIR_ARG}
      "--quiet"
      "--enable=all"
      "--inline-suppr"
      ${CPPCHECK_TEMPLATE_ARG}
      ${CPPCHECK_OTHER_ARGS}
      ${CPPCHECK_EXCLUDES_ARG})
  if(CPPCHECK_XML_OUTPUT)
    list(APPEND CPPCHECK_OPTS --xml --xml-version=2 2> ${CPPCHECK_XML_OUTPUT})
  endif()
endif()

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(cppcheck DEFAULT_MSG CPPCHECK_BIN)

mark_as_advanced(
  CPPCHECK_BIN
  CPPCHECK_PROJECT_ARG
  CPPCHECK_THREADS_ARG
  CPPCHECK_BUILD_DIR_ARG
  CPPCHECK_EXITCODE_ARG
  CPPCHECK_EXCLUDES
  CPPCHECK_OTHER_ARGS)

if(CPPCHECK_FOUND)
  message(STATUS "found ${CPPCHECK_VERSION}: ${CPPCHECK_BIN}")
  message(STATUS "cppcheck options: ${CPPCHECK_OPTS}")
  message(STATUS "cppcheck suppressions: ${CPPCHECK_SUPRESSIONS_FILE}")
  set(CMAKE_C_CPPCHECK ${CPPCHECK_BIN} --std=c${CMAKE_C_STANDARD}
                       ${CPPCHECK_OPTS})
  set(CMAKE_CXX_CPPCHECK ${CPPCHECK_BIN} --std=c++${CMAKE_CXX_STANDARD}
                         ${CPPCHECK_OPTS})
else()
  message(STATUS "cannot find Cppcheck.")
endif()
