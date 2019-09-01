#!/bin/bash
#
# This script cuts a new release from the current active branch.

cd $(dirname $0)
set -e
script_name=$(basename $0)

RESET="\e[0m\e[39m"
BOLD="\e[1m"
DIM="\e[2m"
CYAN="\e[36m"
MAGENTA="\e[35m"
RED="\e[31m"
GREEN="\e[32m"

# Script-Header
printf "${GREEN}${script_name}${RESET} ${DIM}v1.0.0${RESET}\n\n"

################################
# Define usage flags/arguments.
################################
read -r -d '' usage <<-EOF || true
  ${CYAN}-t --type${RESET}    ${MAGENTA}[arg]${RESET}  Release-Type. One of "patch", "minor" or "major". Default=patch
  ${CYAN}-d --dryrun${RESET}         Perform a dryrun. Doesn't push to origin.
  ${CYAN}-h --help${RESET}           This page.
EOF

############################################################
# Define the helptext which is displayed on the usage page.
############################################################
read -r -d '' helptext <<-EOF || true
 We support the following release types:
  - ${CYAN}patch${RESET} ${DIM}(0.0.1 -> 0.0.2)${RESET}
  - ${CYAN}minor${RESET} ${DIM}(0.0.1 -> 0.1.0)${RESET}
  - ${CYAN}major${RESET} ${DIM}(0.0.1 -> 1.0.0)${RESET}
EOF

##########################################
# Prints usage and helptext informations.
##########################################
help () {
  printf "${BOLD}Usage:${RESET} ${script_name} ${CYAN}[--options] ${MAGENTA}[arg]${RESET}\n"
  printf "\n"
  printf "${BOLD}Options:${RESET}\n"
  printf "  ${usage:-No usage available}\n"
  printf "\n"

  if [[ "${helptext:-}" ]]; then
    printf " ${helptext}\n"
    printf "\n"
  fi

  exit 1
}

###########################################
# Prints error and help text informations.
###########################################
error() {
  printf "${BOLD}Error:${RESET}\n"
  printf " ${*}"
  printf "\n\n"

  # Exits with status code 1
  help
}

############################################################
# Find file up the file-tree.
# @param {string} $1 File to find
# @param {number} $2 Maximal levels to search up. Default=2
############################################################
findUp() {
  steps=0
  maxSteps=${2:-2}
  x=`pwd`
  while [ "$x" != "/" ] && [ $steps -le $maxSteps ] ; do
      found=$(find "$x" -maxdepth 1 -name $1 | sed 's|/[^/]*$||')
      if [[ ! -z $found ]]; then
        echo $found
        break
      else
        x=`dirname "$x"`
        ((steps++))
      fi
  done
}

##############################
# Read values from JSON file.
# -> Requires python
##############################
readJson() {
  # Make sure python is installed
  pyv="$(python -V 2>&1)"
  if [[ -z $pyv ]]; then
    error "Python must be installed in order to use this script."
  fi

  # Create python command that will be executed to modify JSON
  read -d '' pyCmd << EOF || true
import json
import sys
import io
from collections import OrderedDict

def nested_get(dataDict, mapList):    
    for k in mapList: dataDict = dataDict[k]
    return dataDict

with io.open(sys.argv[1], encoding='utf-8', mode='r') as jsonFile:
    data = json.load(jsonFile, object_pairs_hook=OrderedDict)
    key = sys.argv[2].split('.')
    print(nested_get(data, key))
EOF

  # Execute python script
  python -c "$pyCmd" "$1" "$2"
}

##############################
# Modify a JSON file.
# -> Requires python
##############################
modifyJson() {
  # Make sure python is installed
  pyv="$(python -V 2>&1)"
  if [[ -z $pyv ]]; then
    error "Python must be installed in order to use this script."
  fi

  # Create python command that will be executed to modify JSON
  read -d '' pyCmd << EOF || true
import json
import sys
import io
from collections import OrderedDict

def nested_set(dic, keys, value):
    for key in keys[:-1]:
        dic = dic.setdefault(key, {})
    dic[keys[-1]] = value

with io.open(sys.argv[1], encoding='utf-8', mode='r+') as jsonFile:
    data = json.load(jsonFile, object_pairs_hook=OrderedDict)
    key = sys.argv[2].split('.')
    nested_set(data, key, sys.argv[3])
    jsonFile.seek(0)
    jsonFile.write(unicode(json.dumps(data, ensure_ascii=False, indent=2, separators=(',', ': '))))
EOF

  # Execute python script
  python -c "$pyCmd" "$1" "$2" "$3"
}

############################################################################
# Parse usage string
# Translate usage string ➞ getopts arguments, and set $arg_<flag> defaults.
###########################################3#################################
while read -r tmp_line; do
  # Remove ANSI escape sequences.
  tmp_line=$(echo ${tmp_line} | sed 's/\\e\[[0-9;]*[a-zA-Z]//g')

  if [[ "${tmp_line}" =~ ^- ]]; then
    # Fetch single character version of option string
    tmp_opt="${tmp_line%% *}"
    tmp_opt="${tmp_opt:1}"

    # Fetch long version if present
    tmp_long_opt=""
    if [[ "${tmp_line}" = *"--"* ]]; then
      tmp_long_opt="${tmp_line#*--}"
      tmp_long_opt="${tmp_long_opt%% *}"
    fi

    # Map opt long name to/from opt short name
    printf -v "tmp_opt_long2short_${tmp_long_opt//-/_}" '%s' "${tmp_opt}"
    printf -v "tmp_opt_short2long_${tmp_opt}" '%s' "${tmp_long_opt//-/_}"

    # Check if option takes an argument
    if [[ "${tmp_line}" =~ \[.*\] ]]; then
      # Add ":" if opt has arg
      tmp_opt="${tmp_opt}:" 
      # It has an arg. Init with ""
      tmp_init=""  
      printf -v "tmp_has_arg_${tmp_opt:0:1}" '%s' "1"
    elif [[ "${tmp_line}" =~ \{.*\} ]]; then
      tmp_opt="${tmp_opt}:"
      tmp_init=""
      # Remember that this option requires an argument
      printf -v "tmp_has_arg_${tmp_opt:0:1}" '%s' "2"
    else
      # Opt is a flag. Init with 0
      tmp_init="0"
      printf -v "tmp_has_arg_${tmp_opt:0:1}" '%s' "0"
    fi
    tmp_opts="${tmp_opts:-}${tmp_opt}"
  fi

  [[ "${tmp_opt:-}" ]] || continue

  if [[ "${tmp_line}" =~ ^Default= ]] || [[ "${tmp_line}" =~ \.\ *Default= ]]; then
    # Ignore default value if option does not have an argument
    tmp_varname="tmp_has_arg_${tmp_opt:0:1}"

    if [[ "${!tmp_varname}" != "0" ]]; then
      tmp_init="${tmp_line##*Default=}"
      tmp_re='^"(.*)"$'
      if [[ "${tmp_init}" =~ ${tmp_re} ]]; then
        tmp_init="${BASH_REMATCH[1]}"
      else
        tmp_re="^'(.*)'$"
        if [[ "${tmp_init}" =~ ${tmp_re} ]]; then
          tmp_init="${BASH_REMATCH[1]}"
        fi
      fi
    fi
  fi

  if [[ "${tmp_line}" =~ ^Required\. ]] || [[ "${tmp_line}" =~ \.\ *Required\. ]]; then
    # Remember that this option requires an argument
    printf -v "tmp_has_arg_${tmp_opt:0:1}" '%s' "2"
  fi

  printf -v "arg_${tmp_opt:0:1}" '%s' "${tmp_init}"
done <<< "${usage:-}"

#######################################################
# Run getopts only if options were specified in usage.
#######################################################
if [[ "${tmp_opts:-}" ]]; then
  # Allow long options like --this
  tmp_opts="${tmp_opts}-:"

  # Reset in case getopts has been used previously in the shell.
  OPTIND=1

  # Start parsing command line.
  # Unexpected arguments will cause unbound variables to be dereferenced.
  set +o nounset
  # Overwrite $arg_<flag> defaults with the actual CLI options
  while getopts ${tmp_opts} tmp_opt; do
    [[ "${tmp_opt}" = "?" ]] && error "Invalid use of script: ${*} "

    if [[ "${tmp_opt}" = "-" ]]; then
      # OPTARG is long-option-name or long-option=value
      if [[ "${OPTARG}" =~ .*=.* ]]; then
        # --key=value format
        tmp_long_opt=${OPTARG/=*/}
        # Set opt to the short option corresponding to the long option
        tmp_varname="tmp_opt_long2short_${tmp_long_opt//-/_}"
        printf -v "tmp_opt" '%s' "${!tmp_varname}"
        OPTARG=${OPTARG#*=}
      else
        # --key value format
        # Map long name to short version of option
        tmp_varname="tmp_opt_long2short_${OPTARG//-/_}"
        printf -v "tmp_opt" '%s' "${!tmp_varname}"
        # Only assign OPTARG if option takes an argument
        tmp_varname="tmp_has_arg_${tmp_opt}"
        tmp_varvalue="${!tmp_varname}"
        [[ "${tmp_varvalue}" != "0" ]] && tmp_varvalue="1"
        printf -v "OPTARG" '%s' "${@:OPTIND:${tmp_varvalue}}"
        # Shift over the argument if argument is expected
        ((OPTIND+=tmp_varvalue))
      fi
      # we have set opt/OPTARG to the short value and the argument as OPTARG if it exists
    fi
    tmp_varname="arg_${tmp_opt:0:1}"
    tmp_default="${!tmp_varname}"

    tmp_value="${OPTARG}"
    if [[ -z "${OPTARG}" ]]; then
      tmp_value=$((tmp_default + 1))
    fi

    printf -v "${tmp_varname}" '%s' "${tmp_value}"
  done
  # No more unbound variable references expected
  set -o nounset

  shift $((OPTIND-1))

  if [[ "${1:-}" = "--" ]] ; then
    shift
  fi
fi

#####################################################
# Automatic validation of required option arguments.
#####################################################
for tmp_varname in ${!tmp_has_arg_*}; do
  # validate only options which required an argument
  [[ "${!tmp_varname}" = "2" ]] || continue

  tmp_opt_short="${tmp_varname##*_}"
  tmp_varname="arg_${tmp_opt_short}"
  [[ "${!tmp_varname}" ]] && continue

  tmp_varname="tmp_opt_short2long_${tmp_opt_short}"
  printf -v "tmp_opt_long" '%s' "${!tmp_varname}"
  [[ "${tmp_opt_long:-}" ]] && tmp_opt_long=" (--${tmp_opt_long//_/-})"

  error "Option -${tmp_opt_short}${tmp_opt_long:-} requires an argument."
done

#####################################
# Cleanup tmp environment variables.
#####################################
for tmp_varname in ${!tmp_*}; do
  unset -v "${tmp_varname}"
done
unset -v tmp_varname

###########################
# Check if -h flag is set.
###########################
if [[ "${arg_h:?}" = "1" ]]; then
  # Help exists with code 1
  help
fi

# Check dryrun flag.
if [[ "${arg_d:?}" = "1" ]]; then
  printf "Performing a ${CYAN}dryrun${RESET}. No deployment will be executed!\n"
fi

# Get current version from package.json
VERSION_FILE_PATH=$(findUp package.json)
VERSION=$(readJson ${VERSION_FILE_PATH}/package.json version)
IFS='.' read -r -a SEMVER <<< "${VERSION}"
# Set new semver number
case ${arg_t} in
  patch)
    printf -v "NEW_VERSION" '%s.%s.%s' ${SEMVER[0]} ${SEMVER[1]} $((${SEMVER[2]} + 1))
    ;;
  minor)
    printf -v "NEW_VERSION" '%s.%s.0' "${SEMVER[0]}" "$((${SEMVER[1]} + 1))"
    ;;
  major)
    printf -v "NEW_VERSION" '%s.0.0' "$((${SEMVER[0]} + 1))"
    ;;
  *)
    error "-t (--type) argument must be one of \"patch\", \"minor\" or \"major\""
    ;;
esac
printf "Cutting ${CYAN}${arg_t}${RESET} release. ${DIM}(${VERSION} --> ${NEW_VERSION})${RESET}\n"

# Save current branch name.
CUR_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create "release/" branch.
printf "Creating \"${CYAN}release/${NEW_VERSION}${RESET}\"..."
git checkout -b release/${NEW_VERSION} >/dev/null 2>&1
# Push of dryrun
if [[ "${arg_d:?}" = "0" ]]; then
  git push -u origin release/${NEW_VERSION} >/dev/null 2>&1
fi
printf "done.\n"

# Update version and push
printf "Update version to ${NEW_VERSION}, commit and push..."
modifyJson ${VERSION_FILE_PATH}/package.json version ${NEW_VERSION}
git add ${VERSION_FILE_PATH}/package.json >/dev/null 2>&1
git commit -m "Cut release ${NEW_VERSION}" >/dev/null 2>&1
if [[ "${arg_d:?}" = "0" ]]; then
  git push >/dev/null 2>&1
fi
printf "done.\n"

# Merge release into master
printf "Merging release into master, tag and push..."
git checkout master >/dev/null 2>&1
git merge release/${NEW_VERSION} --no-edit >/dev/null 2>&1
git tag -a -m "Cut release ${NEW_VERSION}" ${NEW_VERSION} >/dev/null 2>&1
if [[ "${arg_d:?}" = "0" ]]; then
  git push --follow-tags >/dev/null 2>&1
fi
printf "done.\n"

# Merge release into source branch
printf "Merging release into ${CUR_BRANCH}, tag and push..."
git checkout ${CUR_BRANCH} >/dev/null 2>&1
git merge release/${NEW_VERSION} --no-edit >/dev/null 2>&1
if [[ "${arg_d:?}" = "0" ]]; then
  git push --follow-tags >/dev/null 2>&1
fi
printf "done.\n"

# Removing stray release branch
printf "Cleaning up..."
if [[ "${arg_d:?}" = "0" ]]; then
  git push --delete origin release/${NEW_VERSION} >/dev/null 2>&1
fi
git branch -d release/${NEW_VERSION} >/dev/null 2>&1
printf "done.\n"

printf "${BOLD}${GREEN}Success.${RESET} Finished cutting release ${NEW_VERSION}\n"